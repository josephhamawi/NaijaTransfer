/**
 * Firestore security rules, exercised against the emulator.
 *
 * These are the only tests that verify firestore.rules itself. The
 * service-level tests prove the server logic (quotas, atomic claim,
 * deep delete); these prove the other half — that a browser holding the
 * project's public API key cannot do anything it should not, including
 * reading a room it does not belong to or tampering with the fields the
 * server owns.
 *
 * Requires the Firestore emulator, which needs JDK 21 or newer:
 *
 *     brew install openjdk@21
 *     npm run test:rules
 *
 * Kept out of `npm test` on purpose: the default suite must not depend
 * on a JDK being installed.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs } from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

const PROJECT_ID = "demo-livesend";
const SENDER = "uid-sender";
const RECIPIENT = "uid-recipient";
const STRANGER = "uid-stranger";
const ROOM = "room-under-test";

let env: RulesTestEnvironment;

/** A room in the state the server leaves it after a successful claim. */
function claimedRoom() {
  return {
    senderUid: SENDER,
    recipientUid: RECIPIENT,
    state: "claimed",
    inviteHash: "a".repeat(64),
    createdAt: new Date(),
    joinExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
    claimAttempts: 0,
    offer: null,
    answer: null,
    closedAt: null,
  };
}

async function seed(data: Record<string, unknown> = claimedRoom()) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), "liveRooms", ROOM), data);
  });
}

const dbFor = (uid: string | null) =>
  (uid ? env.authenticatedContext(uid) : env.unauthenticatedContext()).firestore();

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync(path.join(process.cwd(), "firestore.rules"), "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
  });
});

afterAll(async () => {
  await env?.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
});

describe("room access", () => {
  it("lets the sender and the recipient read the room", async () => {
    await seed();
    await assertSucceeds(getDoc(doc(dbFor(SENDER), "liveRooms", ROOM)));
    await assertSucceeds(getDoc(doc(dbFor(RECIPIENT), "liveRooms", ROOM)));
  });

  it("refuses a third party, even knowing the room id", async () => {
    await seed();
    await assertFails(getDoc(doc(dbFor(STRANGER), "liveRooms", ROOM)));
  });

  it("refuses an unauthenticated reader", async () => {
    await seed();
    await assertFails(getDoc(doc(dbFor(null), "liveRooms", ROOM)));
  });

  it("hides an unclaimed room from everyone but its sender", async () => {
    await seed({ ...claimedRoom(), recipientUid: null, state: "waiting" });
    await assertSucceeds(getDoc(doc(dbFor(SENDER), "liveRooms", ROOM)));
    await assertFails(getDoc(doc(dbFor(RECIPIENT), "liveRooms", ROOM)));
  });

  it("refuses client room creation and deletion", async () => {
    await assertFails(
      setDoc(doc(dbFor(SENDER), "liveRooms", "forged-room"), claimedRoom())
    );
    await seed();
    await assertFails(deleteDoc(doc(dbFor(SENDER), "liveRooms", ROOM)));
    await assertFails(deleteDoc(doc(dbFor(RECIPIENT), "liveRooms", ROOM)));
  });
});

describe("SDP exchange", () => {
  it("lets the sender publish an offer and the recipient an answer", async () => {
    await seed();
    await assertSucceeds(
      updateDoc(doc(dbFor(SENDER), "liveRooms", ROOM), { offer: "v=0 fake offer" })
    );
    await assertSucceeds(
      updateDoc(doc(dbFor(RECIPIENT), "liveRooms", ROOM), { answer: "v=0 fake answer" })
    );
  });

  it("stops each side writing the other's field", async () => {
    await seed();
    await assertFails(
      updateDoc(doc(dbFor(SENDER), "liveRooms", ROOM), { answer: "v=0 forged" })
    );
    await assertFails(
      updateDoc(doc(dbFor(RECIPIENT), "liveRooms", ROOM), { offer: "v=0 forged" })
    );
  });

  it("rejects an empty or oversized SDP", async () => {
    await seed();
    await assertFails(updateDoc(doc(dbFor(SENDER), "liveRooms", ROOM), { offer: "" }));
    await assertFails(
      updateDoc(doc(dbFor(SENDER), "liveRooms", ROOM), { offer: "x".repeat(20000) })
    );
  });

  it("refuses a third party writing anything", async () => {
    await seed();
    await assertFails(
      updateDoc(doc(dbFor(STRANGER), "liveRooms", ROOM), { offer: "v=0 forged" })
    );
  });
});

describe("server-owned fields", () => {
  // One case per field so a failure names the field that slipped
  // through, rather than failing somewhere inside a loop.
  //
  // Every value here genuinely differs from the seeded room. Writing a
  // field back with the value it already has produces no affected keys
  // in Firestore's diff, so rules cannot see it and it changes nothing
  // — that is a no-op, not a bypass.
  const tamper: Array<[string, Record<string, unknown>]> = [
    ["senderUid", { senderUid: STRANGER }],
    ["recipientUid", { recipientUid: STRANGER }],
    ["inviteHash", { inviteHash: "b".repeat(64) }],
    ["claimAttempts", { claimAttempts: 99 }],
    ["joinExpiresAt", { joinExpiresAt: new Date(Date.now() + 86_400_000) }],
    ["createdAt", { createdAt: new Date(0) }],
  ];

  for (const [field, change] of tamper) {
    it(`refuses the sender changing ${field}`, async () => {
      await seed();
      await assertFails(updateDoc(doc(dbFor(SENDER), "liveRooms", ROOM), change));
    });

    it(`refuses the recipient changing ${field}`, async () => {
      await seed();
      await assertFails(updateDoc(doc(dbFor(RECIPIENT), "liveRooms", ROOM), change));
    });
  }

  it("refuses unknown fields", async () => {
    await seed();
    await assertFails(
      updateDoc(doc(dbFor(SENDER), "liveRooms", ROOM), { manifest: "file list" })
    );
  });
});

describe("state transitions", () => {
  it("allows claimed → connected → closed", async () => {
    await seed();
    await assertSucceeds(
      updateDoc(doc(dbFor(SENDER), "liveRooms", ROOM), { state: "connected" })
    );
    await assertSucceeds(
      updateDoc(doc(dbFor(RECIPIENT), "liveRooms", ROOM), { state: "closed" })
    );
  });

  it("refuses reopening a room", async () => {
    await seed({ ...claimedRoom(), state: "connected" });
    await assertFails(
      updateDoc(doc(dbFor(SENDER), "liveRooms", ROOM), { state: "waiting" })
    );
    await assertFails(
      updateDoc(doc(dbFor(SENDER), "liveRooms", ROOM), { state: "claimed" })
    );
  });
});

describe("ICE candidates", () => {
  const CAND = {
    candidate: "candidate:1 1 udp 2113937151 192.0.2.1 50000 typ host",
    sdpMid: "0",
    sdpMLineIndex: 0,
    createdAt: new Date(),
  };

  it("lets each side write its own candidates and read the other's", async () => {
    await seed();
    await assertSucceeds(
      setDoc(doc(dbFor(SENDER), "liveRooms", ROOM, "senderCandidates", "000"), CAND)
    );
    await assertSucceeds(
      setDoc(doc(dbFor(RECIPIENT), "liveRooms", ROOM, "recipientCandidates", "000"), CAND)
    );
    await assertSucceeds(
      getDocs(collection(dbFor(RECIPIENT), "liveRooms", ROOM, "senderCandidates"))
    );
    await assertSucceeds(
      getDocs(collection(dbFor(SENDER), "liveRooms", ROOM, "recipientCandidates"))
    );
  });

  it("stops a side writing into the other's candidate collection", async () => {
    await seed();
    await assertFails(
      setDoc(doc(dbFor(SENDER), "liveRooms", ROOM, "recipientCandidates", "000"), CAND)
    );
    await assertFails(
      setDoc(doc(dbFor(RECIPIENT), "liveRooms", ROOM, "senderCandidates", "000"), CAND)
    );
  });

  it("refuses a third party entirely", async () => {
    await seed();
    await assertFails(
      setDoc(doc(dbFor(STRANGER), "liveRooms", ROOM, "senderCandidates", "000"), CAND)
    );
    await assertFails(
      getDocs(collection(dbFor(STRANGER), "liveRooms", ROOM, "senderCandidates"))
    );
  });

  it("enforces the 60-per-side cap through the document id", async () => {
    await seed();
    await assertSucceeds(
      setDoc(doc(dbFor(SENDER), "liveRooms", ROOM, "senderCandidates", "059"), CAND)
    );
    await assertFails(
      setDoc(doc(dbFor(SENDER), "liveRooms", ROOM, "senderCandidates", "060"), CAND)
    );
    await assertFails(
      setDoc(doc(dbFor(SENDER), "liveRooms", ROOM, "senderCandidates", "999"), CAND)
    );
    await assertFails(
      setDoc(doc(dbFor(SENDER), "liveRooms", ROOM, "senderCandidates", "abc"), CAND)
    );
  });

  it("refuses overwriting or deleting a candidate", async () => {
    await seed();
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(
        doc(ctx.firestore(), "liveRooms", ROOM, "senderCandidates", "000"),
        CAND
      );
    });
    await assertFails(
      setDoc(doc(dbFor(SENDER), "liveRooms", ROOM, "senderCandidates", "000"), CAND)
    );
    await assertFails(
      deleteDoc(doc(dbFor(SENDER), "liveRooms", ROOM, "senderCandidates", "000"))
    );
  });

  it("rejects malformed candidate documents", async () => {
    await seed();
    const bad = [
      { ...CAND, candidate: "" },
      { ...CAND, candidate: "x".repeat(2000) },
      { ...CAND, extra: "payload" },
      { ...CAND, createdAt: "not a timestamp" },
      { ...CAND, sdpMLineIndex: "zero" },
    ];
    for (const value of bad) {
      await assertFails(
        setDoc(doc(dbFor(SENDER), "liveRooms", ROOM, "senderCandidates", "001"), value)
      );
    }
  });

  it("refuses candidates once the room is closed", async () => {
    await seed({ ...claimedRoom(), state: "closed" });
    await assertFails(
      setDoc(doc(dbFor(SENDER), "liveRooms", ROOM, "senderCandidates", "000"), CAND)
    );
  });
});

describe("everything else is deny-all", () => {
  it("blocks the client from reading or writing app collections", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "transfers", "t1"), { shortCode: "abc" });
      await setDoc(doc(ctx.firestore(), "users", SENDER), { tier: "FREE" });
    });

    const db = dbFor(SENDER);
    await assertFails(getDoc(doc(db, "transfers", "t1")));
    await assertFails(getDoc(doc(db, "users", SENDER)));
    await assertFails(setDoc(doc(db, "users", SENDER), { tier: "BUSINESS" }));
    await assertFails(getDoc(doc(db, "counters", "egress_2026-11")));
    await assertFails(setDoc(doc(db, "liveRateLimits", "anything"), { creates: 0 }));
  });
});
