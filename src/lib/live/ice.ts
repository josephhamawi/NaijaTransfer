/**
 * ICE configuration for Live Send — the one place STUN is defined.
 *
 * ── What we depend on, stated plainly ────────────────────────────────
 * Firebase does NOT provide a managed WebRTC STUN or TURN service.
 * Nothing in the Firebase or Google Cloud product set fills that role,
 * so the dependency has to come from somewhere else and be named.
 *
 * Default: Google's public STUN servers (`stun.l.google.com:19302` and
 * its siblings). They are free, require no credentials, and are what
 * most WebRTC examples use. They are also offered with no SLA, no
 * support commitment and no guarantee of continued availability. If
 * they disappear, Live Send degrades to working only between peers that
 * can reach each other on host candidates — typically the same LAN.
 *
 * Override without a code change by setting
 * `NEXT_PUBLIC_LIVE_STUN_URLS` to a comma-separated list.
 *
 * ── What we deliberately do NOT have ─────────────────────────────────
 * No TURN relay. STUN only discovers a peer's public address; it cannot
 * forward traffic. When both peers sit behind symmetric NAT or CGNAT —
 * common on Nigerian mobile networks — no candidate pair will connect
 * and the transfer cannot happen. There is no fallback: the product
 * says so and offers the paid Stored Transfer instead.
 *
 * Adding TURN would fix those cases and would also mean paying for every
 * relayed byte, which is the exact cost this feature exists to remove.
 * That is a pricing decision, not an oversight.
 */

export const DEFAULT_STUN_URLS = [
  "stun:stun.l.google.com:19302",
  "stun:stun1.l.google.com:19302",
];

function configuredStunUrls(): string[] {
  // Guarded: Next.js inlines NEXT_PUBLIC_* at build time, but this
  // module is also bundled standalone for the end-to-end harness, where
  // `process` does not exist. A bare access throws there and takes the
  // whole peer connection down.
  const raw =
    typeof process !== "undefined" ? process.env?.NEXT_PUBLIC_LIVE_STUN_URLS : undefined;
  if (!raw) return DEFAULT_STUN_URLS;
  const urls = raw
    .split(",")
    .map((u) => u.trim())
    .filter((u) => u.startsWith("stun:") || u.startsWith("stuns:"));
  return urls.length > 0 ? urls : DEFAULT_STUN_URLS;
}

/**
 * Only STUN servers are listed, so in practice only host and srflx
 * candidates are gathered. A browser with its own TURN configuration
 * (enterprise policy, extension) could still produce a relay candidate,
 * which is why `inspectSelectedPair`/`isRelayed` below check the pair
 * that actually won rather than trusting this configuration.
 */
export function buildIceConfig(): RTCConfiguration {
  return {
    iceServers: [{ urls: configuredStunUrls() }],
    iceCandidatePoolSize: 2,
    bundlePolicy: "max-bundle",
  };
}

export interface SelectedPair {
  localType?: string;
  remoteType?: string;
  /** True when either end of the chosen pair is a TURN relay. */
  relayed: boolean;
}

/**
 * Inspect the negotiated candidate pair.
 *
 * Live Send promises that bytes travel directly between browsers. The
 * promise is only worth making if it is checked, so this reads the
 * actual selected pair out of `getStats()` rather than inferring it
 * from configuration.
 */
export async function inspectSelectedPair(
  pc: RTCPeerConnection
): Promise<SelectedPair | null> {
  let stats: RTCStatsReport;
  try {
    stats = await pc.getStats();
  } catch {
    return null;
  }

  const candidates = new Map<string, { candidateType?: string }>();
  let selected:
    | { localCandidateId?: string; remoteCandidateId?: string }
    | undefined;

  stats.forEach((report: Record<string, unknown> & { type: string; id: string }) => {
    if (report.type === "local-candidate" || report.type === "remote-candidate") {
      candidates.set(report.id, {
        candidateType: report.candidateType as string | undefined,
      });
    }
    // Chrome and Firefox disagree on which field marks the live pair.
    if (
      report.type === "candidate-pair" &&
      (report.selected === true || report.state === "succeeded" || report.nominated === true)
    ) {
      // Prefer an explicitly selected pair if we see one later.
      if (!selected || report.selected === true) {
        selected = {
          localCandidateId: report.localCandidateId as string | undefined,
          remoteCandidateId: report.remoteCandidateId as string | undefined,
        };
      }
    }
  });

  if (!selected) return null;

  const localType = selected.localCandidateId
    ? candidates.get(selected.localCandidateId)?.candidateType
    : undefined;
  const remoteType = selected.remoteCandidateId
    ? candidates.get(selected.remoteCandidateId)?.candidateType
    : undefined;

  return {
    localType,
    remoteType,
    relayed: localType === "relay" || remoteType === "relay",
  };
}

/** True when the pair is known-relayed. Unknown pairs are not assumed relayed. */
export function isRelayed(pair: SelectedPair | null): boolean {
  return pair?.relayed === true;
}
