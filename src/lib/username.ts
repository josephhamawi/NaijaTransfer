import { db } from "@/lib/db";

/**
 * Build the username stem: first 3 letters of the first name + first 3 of the
 * last name, lowercased and stripped of non-alphanumerics. Padded with "x" if
 * a name is shorter than 3 usable characters so the stem is always 6 chars.
 */
function stem(first: string, last: string): string {
  const clean = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const f = clean(first).slice(0, 3).padEnd(3, "x");
  const l = clean(last).slice(0, 3).padEnd(3, "x");
  return `${f}${l}`;
}

/**
 * Generate a unique username of the form <first3><last3><3 digits>, e.g.
 * "Joseph Hamawi" -> "josham482". Re-rolls the digits until the value is free
 * in the users table; falls back to a timestamp suffix if it can't find a free
 * 3-digit combination (vanishingly unlikely).
 */
export async function generateUniqueUsername(first: string, last: string): Promise<string> {
  const base = stem(first, last);
  for (let attempt = 0; attempt < 25; attempt++) {
    const digits = Math.floor(100 + Math.random() * 900); // always 3 digits (100–999)
    const candidate = `${base}${digits}`;
    const existing = await db.user.findUnique({ where: { username: candidate } });
    if (!existing) return candidate;
  }
  return `${base}${Date.now().toString().slice(-6)}`;
}
