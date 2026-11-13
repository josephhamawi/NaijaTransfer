import { describe, expect, it } from "vitest";
import {
  ABANDONED_ROOM_MS,
  claimRoom,
  closeRoom,
  createRoom,
  getRoom,
  JOIN_WINDOW_MS,
  LiveRoomError,
  MAX_CLAIM_ATTEMPTS,
  MAX_ROOMS_PER_HOUR,
  RECIPIENT_CANDIDATES,
  ROOMS_COLLECTION,
  SENDER_CANDIDATES,
  sweepAbandonedRooms,
  type FirestoreLike,
} from "@/services/live-room.service";
import { fakeDb, type FakeFirestore } from "./fake-firestore";

/**
 * One clock for the whole suite.
 *
 * Every call takes an explicit `now`: creating a room at a fixed
 * timestamp and then claiming it at wall-clock time would make these
 * tests pass or fail depending on when they run.
 */
const T0 = new Date("2026-11-13T10:00:00Z");

const SENDER = "uid-sender";
const RECIPIENT = "uid-recipient";
const INTRUDER = "uid-intruder";

function db(): { store: FakeFirestore; as: FirestoreLike } {
  const store = fakeDb();
  return { store, as: store as unknown as FirestoreLike };
}

async function open(as: FirestoreLike, now = T0) {
  return createRoom(SENDER, { db: as, now });
}

describe("createRoom", () => {
  it("stores only the hash of the invitation secret", async () => {
    const { store, as } = db();
    const room = await open(as);

    const doc = store.docs.get(`${ROOMS_COLLECTION}/${room.roomId}`)!;
    expect(doc.inviteHash).toMatch(/^[0-9a-f]{64}$/);
    // The secret itself must appear nowhere in the stored document.
    expect(JSON.stringify(doc)).not.toContain(room.inviteSecret);
  });

  it("records the sender, no recipient, and a 15-minute join window", async () => {
    const { as } = db();
    const now = new Date("2026-11-13T10:00:00Z");
    const room = await open(as, now);

    const stored = await getRoom(room.roomId, { db: as });
    expect(stored).toMatchObject({ senderUid: SENDER, recipientUid: null, state: "waiting" });
    expect(room.joinExpiresAt.getTime() - now.getTime()).toBe(JOIN_WINDOW_MS);
  });

  it("gives every room a distinct id and secret", async () => {
    const { as } = db();
    const a = await open(as);
    const b = await open(as);
    expect(a.roomId).not.toBe(b.roomId);
    expect(a.inviteSecret).not.toBe(b.inviteSecret);
  });

  it("refuses past the per-hour room quota", async () => {
    const { as } = db();
    const now = new Date("2026-11-13T10:00:00Z");
    for (let i = 0; i < MAX_ROOMS_PER_HOUR; i++) {
      await createRoom(SENDER, { db: as, now });
    }
    await expect(createRoom(SENDER, { db: as, now })).rejects.toMatchObject({
      code: "RATE_LIMITED",
    });
  });

  it("counts the quota per hour bucket, not forever", async () => {
    const { as } = db();
    for (let i = 0; i < MAX_ROOMS_PER_HOUR; i++) {
      await createRoom(SENDER, { db: as, now: new Date("2026-11-13T10:00:00Z") });
    }
    // Next hour: allowed again.
    await expect(
      createRoom(SENDER, { db: as, now: new Date("2026-11-13T11:00:00Z") })
    ).resolves.toMatchObject({ roomId: expect.any(String) });
  });

  it("applies a separate IP quota so a fresh anonymous uid is not a reset", async () => {
    const { as } = db();
    const now = new Date("2026-11-13T10:00:00Z");
    // Different uid each time, same IP: the uid quota never trips, so
    // only the IP bucket can stop this.
    let created = 0;
    try {
      for (let i = 0; i < 200; i++) {
        await createRoom(`anon-${i}`, { db: as, now, ipHash: "same-ip" });
        created += 1;
      }
    } catch (err) {
      expect((err as LiveRoomError).code).toBe("RATE_LIMITED");
    }
    expect(created).toBeGreaterThan(0);
    expect(created).toBeLessThan(200);
  });
});

describe("claimRoom", () => {
  it("binds the recipient and moves the room to claimed", async () => {
    const { as } = db();
    const room = await open(as);

    const claim = await claimRoom(room.roomId, room.inviteSecret, RECIPIENT, { db: as, now: T0 });
    expect(claim).toMatchObject({ senderUid: SENDER, rejoined: false });

    const stored = await getRoom(room.roomId, { db: as });
    expect(stored).toMatchObject({ recipientUid: RECIPIENT, state: "claimed" });
  });

  it("rejects a wrong secret and does not bind anyone", async () => {
    const { as } = db();
    const room = await open(as);

    await expect(
      claimRoom(room.roomId, "x".repeat(43), RECIPIENT, { db: as, now: T0 })
    ).rejects.toMatchObject({ code: "INVALID_INVITE" });

    expect((await getRoom(room.roomId, { db: as }))?.recipientUid).toBeNull();
  });

  it("rejects a secret that is valid for a different room", async () => {
    const { as } = db();
    const a = await open(as);
    const b = await open(as);

    // Secrets are hashed together with their roomId, so one cannot be
    // replayed against another room.
    await expect(claimRoom(b.roomId, a.inviteSecret, RECIPIENT, { db: as, now: T0 })).rejects.toMatchObject(
      { code: "INVALID_INVITE" }
    );
  });

  it("rejects a third participant once a recipient has claimed", async () => {
    const { as } = db();
    const room = await open(as);

    await claimRoom(room.roomId, room.inviteSecret, RECIPIENT, { db: as, now: T0 });
    await expect(
      claimRoom(room.roomId, room.inviteSecret, INTRUDER, { db: as, now: T0 })
    ).rejects.toMatchObject({ code: "ALREADY_CLAIMED" });

    expect((await getRoom(room.roomId, { db: as }))?.recipientUid).toBe(RECIPIENT);
  });

  it("lets exactly one of two concurrent claims win", async () => {
    const { as } = db();
    const room = await open(as);

    const results = await Promise.allSettled([
      claimRoom(room.roomId, room.inviteSecret, RECIPIENT, { db: as, now: T0 }),
      claimRoom(room.roomId, room.inviteSecret, INTRUDER, { db: as, now: T0 }),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toMatchObject({
      code: "ALREADY_CLAIMED",
    });
  });

  it("treats a repeat claim by the same uid as a rejoin, not a second participant", async () => {
    const { as } = db();
    const room = await open(as);

    await claimRoom(room.roomId, room.inviteSecret, RECIPIENT, { db: as, now: T0 });
    const again = await claimRoom(room.roomId, room.inviteSecret, RECIPIENT, { db: as, now: T0 });
    expect(again.rejoined).toBe(true);
  });

  it("refuses the sender's own uid", async () => {
    const { as } = db();
    const room = await open(as);
    await expect(
      claimRoom(room.roomId, room.inviteSecret, SENDER, { db: as, now: T0 })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("refuses an unknown room", async () => {
    const { as } = db();
    await expect(
      claimRoom("doesnotexist1234567890", "y".repeat(43), RECIPIENT, { db: as, now: T0 })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("refuses a claim after the join window closes", async () => {
    const { as } = db();
    const now = new Date("2026-11-13T10:00:00Z");
    const room = await open(as, now);

    const late = new Date(now.getTime() + JOIN_WINDOW_MS + 1000);
    await expect(
      claimRoom(room.roomId, room.inviteSecret, RECIPIENT, { db: as, now: late })
    ).rejects.toMatchObject({ code: "EXPIRED" });
  });

  it("does NOT expire a transfer that was already claimed in time", async () => {
    const { as } = db();
    const now = new Date("2026-11-13T10:00:00Z");
    const room = await open(as, now);

    await claimRoom(room.roomId, room.inviteSecret, RECIPIENT, { db: as, now });

    // A long transfer outlives the join window. Rejoining hours later
    // must still work — the window gates joining, not transferring.
    const muchLater = new Date(now.getTime() + 6 * 60 * 60 * 1000);
    await expect(
      claimRoom(room.roomId, room.inviteSecret, RECIPIENT, { db: as, now: muchLater })
    ).resolves.toMatchObject({ rejoined: true });
  });

  it("throttles repeated wrong-secret attempts on one room", async () => {
    const { as } = db();
    const room = await open(as);

    for (let i = 0; i < MAX_CLAIM_ATTEMPTS; i++) {
      await expect(
        claimRoom(room.roomId, "z".repeat(43), INTRUDER, { db: as, now: T0 })
      ).rejects.toMatchObject({ code: "INVALID_INVITE" });
    }

    // Even the correct secret is now refused: the link is burned.
    await expect(
      claimRoom(room.roomId, room.inviteSecret, RECIPIENT, { db: as, now: T0 })
    ).rejects.toMatchObject({ code: "THROTTLED" });
  });
});

describe("closeRoom", () => {
  async function roomWithCandidates() {
    const { store, as } = db();
    const room = await open(as);
    await claimRoom(room.roomId, room.inviteSecret, RECIPIENT, { db: as, now: T0 });

    const ref = as.collection(ROOMS_COLLECTION).doc(room.roomId);
    await ref.collection(SENDER_CANDIDATES).doc("000").set({ candidate: "a" });
    await ref.collection(SENDER_CANDIDATES).doc("001").set({ candidate: "b" });
    await ref.collection(RECIPIENT_CANDIDATES).doc("000").set({ candidate: "c" });
    return { store, as, room };
  }

  it("deletes the room and both candidate subcollections", async () => {
    const { store, as, room } = await roomWithCandidates();
    expect(store.paths().filter((p) => p.includes(room.roomId))).toHaveLength(4);

    await closeRoom(room.roomId, SENDER, { db: as });

    // Nothing left: not the parent, and critically not the children,
    // which a bare parent delete would have orphaned.
    expect(store.paths().filter((p) => p.includes(room.roomId))).toHaveLength(0);
  });

  it("lets the recipient close too", async () => {
    const { store, as, room } = await roomWithCandidates();
    await closeRoom(room.roomId, RECIPIENT, { db: as });
    expect(store.paths().filter((p) => p.includes(room.roomId))).toHaveLength(0);
  });

  it("refuses a non-participant", async () => {
    const { store, as, room } = await roomWithCandidates();
    await expect(closeRoom(room.roomId, INTRUDER, { db: as })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(store.paths().filter((p) => p.includes(room.roomId))).toHaveLength(4);
  });

  it("is a no-op for a room that is already gone", async () => {
    const { as } = db();
    await expect(closeRoom("missingroom1234567890", SENDER, { db: as })).resolves.toBeUndefined();
  });
});

describe("sweepAbandonedRooms", () => {
  const now = new Date("2026-11-13T12:00:00Z");

  it("deletes never-claimed rooms past their join window, with candidates", async () => {
    const { store, as } = db();
    const stale = new Date(now.getTime() - 60 * 60 * 1000);
    const room = await createRoom(SENDER, { db: as, now: stale });

    await as
      .collection(ROOMS_COLLECTION)
      .doc(room.roomId)
      .collection(SENDER_CANDIDATES)
      .doc("000")
      .set({ candidate: "x" });

    const result = await sweepAbandonedRooms({ db: as, now });
    expect(result.roomsDeleted).toBe(1);
    expect(store.paths().filter((p) => p.includes(room.roomId))).toHaveLength(0);
  });

  it("leaves a claimed room alone inside the grace period", async () => {
    const { store, as } = db();
    // Join window closed an hour ago, but the transfer is live.
    const started = new Date(now.getTime() - 60 * 60 * 1000);
    const room = await createRoom(SENDER, { db: as, now: started });
    await claimRoom(room.roomId, room.inviteSecret, RECIPIENT, { db: as, now: started });

    const result = await sweepAbandonedRooms({ db: as, now });
    expect(result.roomsDeleted).toBe(0);
    expect(store.docs.has(`${ROOMS_COLLECTION}/${room.roomId}`)).toBe(true);
  });

  it("deletes a claimed room once it is past the abandonment grace", async () => {
    const { store, as } = db();
    const ancient = new Date(now.getTime() - ABANDONED_ROOM_MS - 1000);
    const room = await createRoom(SENDER, { db: as, now: ancient });
    await claimRoom(room.roomId, room.inviteSecret, RECIPIENT, { db: as, now: ancient });

    const result = await sweepAbandonedRooms({ db: as, now });
    expect(result.roomsDeleted).toBe(1);
    expect(store.docs.has(`${ROOMS_COLLECTION}/${room.roomId}`)).toBe(false);
  });

  it("does not touch rooms whose join window is still open", async () => {
    const { as } = db();
    await createRoom(SENDER, { db: as, now });
    const result = await sweepAbandonedRooms({ db: as, now });
    expect(result.roomsDeleted).toBe(0);
  });
});
