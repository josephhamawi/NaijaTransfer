import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Img,
  staticFile,
} from "remotion";
import { FONT, BRAND_BLUE, CHARCOAL } from "../theme";

export const CTAScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 12 } });

  const urlProgress = spring({
    frame: frame - 0.5 * fps,
    fps,
    config: { damping: 200 },
  });

  const ctaProgress = spring({
    frame: frame - 1 * fps,
    fps,
    config: { damping: 12 },
  });

  const taglineOpacity = interpolate(frame, [1.8 * fps, 2.3 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Pulse for CTA
  const pulseScale = interpolate(
    frame % (1.5 * fps),
    [0, 0.75 * fps, 1.5 * fps],
    [1, 1.04, 1]
  );

  // Floating particles
  const particles = Array.from({ length: 10 }, (_, i) => {
    const seed = i * 137.5;
    const x = (seed % 1080);
    const speed = 2 + (i % 3);
    const y = interpolate(
      (frame + i * 20) % (speed * fps),
      [0, speed * fps],
      [1920, -50],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );
    const opacity = interpolate(y, [-50, 960, 1920], [0, 0.25, 0]);
    return { x, y, opacity, size: 6 + (i % 4) * 4 };
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: CHARCOAL,
        justifyContent: "center",
        alignItems: "center",
        padding: 60,
      }}
    >
      {/* Particles */}
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            backgroundColor: BRAND_BLUE,
            opacity: p.opacity,
          }}
        />
      ))}

      {/* Blue glow */}
      <div
        style={{
          position: "absolute",
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${BRAND_BLUE}18 0%, transparent 60%)`,
        }}
      />

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28, zIndex: 1 }}>
        <div style={{ transform: `scale(${logoScale})` }}>
          <Img src={staticFile("logo.png")} style={{ width: 110, height: 110 }} />
        </div>

        <div style={{ opacity: urlProgress, textAlign: "center" }}>
          <div
            style={{
              fontSize: 30,
              fontFamily: FONT,
              fontWeight: 400,
              color: "rgba(255,255,255,0.6)",
              marginBottom: 16,
            }}
          >
            Start sending files now
          </div>

          {/* URL box */}
          <div
            style={{
              padding: "22px 50px",
              borderRadius: 22,
              border: `3px solid ${BRAND_BLUE}`,
              backgroundColor: `${BRAND_BLUE}10`,
            }}
          >
            <span
              style={{
                fontSize: 48,
                fontFamily: FONT,
                fontWeight: 900,
                color: "#ffffff",
                letterSpacing: 0.5,
              }}
            >
              naijatransfer.com
            </span>
          </div>
        </div>

        {/* CTA button */}
        <div style={{ transform: `scale(${ctaProgress * pulseScale})`, marginTop: 16 }}>
          <div
            style={{
              padding: "22px 56px",
              borderRadius: 50,
              background: `linear-gradient(135deg, ${BRAND_BLUE}, #73bfe8)`,
              display: "flex",
              alignItems: "center",
              gap: 14,
              boxShadow: `0 8px 30px ${BRAND_BLUE}40`,
            }}
          >
            <span style={{ fontSize: 34, fontFamily: FONT, fontWeight: 700, color: "#ffffff" }}>
              Send Files Free
            </span>
            <span style={{ fontSize: 28 }}>☁️</span>
          </div>
        </div>

        {/* Tagline */}
        <div
          style={{
            opacity: taglineOpacity,
            fontSize: 26,
            fontFamily: FONT,
            fontWeight: 500,
            color: "rgba(255,255,255,0.4)",
            textAlign: "center",
            marginTop: 12,
          }}
        >
          4GB free · No account · No wahala
        </div>

        {/* Features row */}
        <div
          style={{
            opacity: interpolate(frame, [2.5 * fps, 3 * fps], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            display: "flex",
            gap: 32,
            marginTop: 12,
          }}
        >
          {["🔒 Secure", "⚡ Fast", "🇳🇬 Naira"].map((label, i) => (
            <span key={i} style={{ fontFamily: FONT, fontSize: 22, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>
              {label}
            </span>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
