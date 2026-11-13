/**
 * Minimal in-memory Firestore double.
 *
 * Implements only what live-room.service.ts uses, but implements it
 * faithfully where it matters:
 *
 *   • documents live in a flat path map, so a subcollection genuinely
 *     survives its parent being deleted — which is the bug the cleanup
 *     code exists to avoid, and it has to be reproducible here
 *   • `runTransaction` runs under a mutex, matching the serialisation
 *     Firestore reaches via contention retries. That is what lets the
 *     tests fire two concurrent claims at one room and assert that
 *     exactly one wins.
 *   • `recursiveDelete` is deliberately absent so the service's manual
 *     subcollection walk is the path under test.
 */

export interface FakeDocSnapshot {
  exists: boolean;
  id: string;
  data(): Record<string, unknown> | undefined;
}

function clone(value: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) {
    out[k] = v instanceof Date ? new Date(v.getTime()) : v;
  }
  return out;
}

function compare(a: unknown, b: unknown): number {
  const av = a instanceof Date ? a.getTime() : (a as number);
  const bv = b instanceof Date ? b.getTime() : (b as number);
  if (av === bv) return 0;
  return av < bv ? -1 : 1;
}

export class FakeFirestore {
  /** path -> document data. Paths are "col/doc" or "col/doc/sub/doc". */
  readonly docs = new Map<string, Record<string, unknown>>();
  private chain: Promise<unknown> = Promise.resolve();
  private idCounter = 0;

  /** Every live path, for assertions about orphaned subcollections. */
  paths(): string[] {
    return [...this.docs.keys()].sort();
  }

  collection(name: string) {
    return new FakeCollection(this, name);
  }

  async runTransaction<T>(
    fn: (tx: {
      get(ref: FakeDocRef): Promise<FakeDocSnapshot>;
      set(ref: FakeDocRef, data: Record<string, unknown>): void;
      update(ref: FakeDocRef, data: Record<string, unknown>): void;
    }) => Promise<T>
  ): Promise<T> {
    // Serialise: concurrent transactions against the same document must
    // not interleave their read and write halves.
    const run = this.chain.then(
      () =>
        fn({
          get: async (ref) => ref.get(),
          set: (ref, data) => {
            this.docs.set(ref.path, clone(data));
          },
          update: (ref, data) => {
            const existing = this.docs.get(ref.path) ?? {};
            this.docs.set(ref.path, { ...existing, ...clone(data) });
          },
        }),
      () =>
        fn({
          get: async (ref) => ref.get(),
          set: (ref, data) => {
            this.docs.set(ref.path, clone(data));
          },
          update: (ref, data) => {
            const existing = this.docs.get(ref.path) ?? {};
            this.docs.set(ref.path, { ...existing, ...clone(data) });
          },
        })
    );
    this.chain = run.catch(() => undefined);
    return run as Promise<T>;
  }

  nextId(): string {
    this.idCounter += 1;
    return `auto${this.idCounter}`;
  }
}

interface Filter {
  field: string;
  op: string;
  value: unknown;
}

export class FakeQuery {
  constructor(
    protected readonly store: FakeFirestore,
    protected readonly prefix: string,
    protected readonly filters: Filter[] = [],
    protected readonly max: number | null = null
  ) {}

  where(field: string, op: string, value: unknown): FakeQuery {
    return new FakeQuery(this.store, this.prefix, [...this.filters, { field, op, value }], this.max);
  }

  limit(n: number): FakeQuery {
    return new FakeQuery(this.store, this.prefix, this.filters, n);
  }

  async get(): Promise<{ docs: FakeDocSnapshot[]; empty: boolean }> {
    const depth = this.prefix.split("/").length + 1;
    const matches: FakeDocSnapshot[] = [];

    for (const [path, data] of this.store.docs) {
      if (!path.startsWith(`${this.prefix}/`)) continue;
      // Direct children only: a query on a collection must not return
      // documents nested in its subcollections.
      if (path.split("/").length !== depth) continue;

      const ok = this.filters.every((f) => {
        const actual = data[f.field];
        switch (f.op) {
          case "==":
            return actual === f.value;
          case "!=":
            return actual !== f.value;
          case "<=":
            return compare(actual, f.value) <= 0;
          case "<":
            return compare(actual, f.value) < 0;
          case ">=":
            return compare(actual, f.value) >= 0;
          case ">":
            return compare(actual, f.value) > 0;
          default:
            throw new Error(`fake firestore: unsupported op ${f.op}`);
        }
      });
      if (!ok) continue;

      const id = path.split("/").pop()!;
      matches.push({ exists: true, id, data: () => clone(data) });
      if (this.max !== null && matches.length >= this.max) break;
    }

    return { docs: matches, empty: matches.length === 0 };
  }
}

export class FakeCollection extends FakeQuery {
  doc(id?: string): FakeDocRef {
    return new FakeDocRef(this.store, `${this.prefix}/${id ?? this.store.nextId()}`);
  }
}

export class FakeDocRef {
  constructor(
    private readonly store: FakeFirestore,
    readonly path: string
  ) {}

  get id(): string {
    return this.path.split("/").pop()!;
  }

  async get(): Promise<FakeDocSnapshot> {
    const data = this.store.docs.get(this.path);
    return {
      exists: data !== undefined,
      id: this.id,
      data: () => (data ? clone(data) : undefined),
    };
  }

  async set(data: Record<string, unknown>): Promise<void> {
    this.store.docs.set(this.path, clone(data));
  }

  async update(data: Record<string, unknown>): Promise<void> {
    const existing = this.store.docs.get(this.path);
    if (existing === undefined) throw new Error(`fake firestore: no document at ${this.path}`);
    this.store.docs.set(this.path, { ...existing, ...clone(data) });
  }

  async delete(): Promise<void> {
    // Mirrors Firestore: deleting a document does NOT delete the
    // documents in its subcollections.
    this.store.docs.delete(this.path);
  }

  collection(name: string): FakeCollection {
    return new FakeCollection(this.store, `${this.path}/${name}`);
  }
}

/** Typed as the service's structural FirestoreLike without importing it. */
export function fakeDb(): FakeFirestore {
  return new FakeFirestore();
}
