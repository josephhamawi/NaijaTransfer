import { describe, expect, it } from "vitest";
import {
  generateInviteSecret,
  generateRoomId,
  hashInviteSecret,
  isWellFormedRoomId,
  isWellFormedSecret,
  verifyInviteSecret,
} from "@/lib/live/invite";

describe("identifier generation", () => {
  it("produces URL-safe room ids of the expected shape", () => {
    for (let i = 0; i < 50; i++) {
      const id = generateRoomId();
      expect(id).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(isWellFormedRoomId(id)).toBe(true);
    }
  });

  it("produces URL-safe secrets of the expected shape", () => {
    for (let i = 0; i < 50; i++) {
      const secret = generateInviteSecret();
      expect(isWellFormedSecret(secret)).toBe(true);
    }
  });

  it("does not repeat", () => {
    const ids = new Set(Array.from({ length: 500 }, generateRoomId));
    const secrets = new Set(Array.from({ length: 500 }, generateInviteSecret));
    expect(ids.size).toBe(500);
    expect(secrets.size).toBe(500);
  });

  it("makes secrets longer than room ids", () => {
    // The room id is public; only the secret authorises joining, so it
    // carries the larger search space.
    expect(generateInviteSecret().length).toBeGreaterThan(generateRoomId().length);
  });
});

describe("hashInviteSecret", () => {
  it("returns a hex sha-256 digest", () => {
    expect(hashInviteSecret("room1", "secret")).toMatch(/^[0-9a-f]{64}$/);
  });

  it("binds the hash to the room, so a secret cannot be replayed elsewhere", () => {
    expect(hashInviteSecret("roomA", "same-secret")).not.toBe(
      hashInviteSecret("roomB", "same-secret")
    );
  });

  it("is deterministic", () => {
    expect(hashInviteSecret("r", "s")).toBe(hashInviteSecret("r", "s"));
  });
});

describe("verifyInviteSecret", () => {
  it("accepts the matching secret", () => {
    const room = generateRoomId();
    const secret = generateInviteSecret();
    expect(verifyInviteSecret(room, secret, hashInviteSecret(room, secret))).toBe(true);
  });

  it("rejects a wrong secret", () => {
    const room = generateRoomId();
    const hash = hashInviteSecret(room, generateInviteSecret());
    expect(verifyInviteSecret(room, generateInviteSecret(), hash)).toBe(false);
  });

  it("rejects the right secret against the wrong room", () => {
    const secret = generateInviteSecret();
    const hash = hashInviteSecret(generateRoomId(), secret);
    expect(verifyInviteSecret(generateRoomId(), secret, hash)).toBe(false);
  });

  it("returns false instead of throwing on junk input", () => {
    expect(verifyInviteSecret("r", "s", "")).toBe(false);
    expect(verifyInviteSecret("r", "s", "not-hex")).toBe(false);
    expect(verifyInviteSecret("r", "s", "a".repeat(64))).toBe(false);
    expect(verifyInviteSecret("r", undefined as unknown as string, "x")).toBe(false);
  });
});

describe("shape guards", () => {
  it("rejects malformed room ids before any lookup", () => {
    for (const bad of ["", "short", "has/slash", "has spaces", "a".repeat(40), null, 42, {}]) {
      expect(isWellFormedRoomId(bad)).toBe(false);
    }
  });

  it("rejects malformed secrets", () => {
    for (const bad of ["", "tooshort", "a".repeat(60), "has/slash".padEnd(43, "a"), null]) {
      expect(isWellFormedSecret(bad)).toBe(false);
    }
  });
});
