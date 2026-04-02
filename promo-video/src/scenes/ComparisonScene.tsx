import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { FONT, CHARCOAL, BRAND_BLUE, ERROR_RED, GOLD } from "../theme";

const competitors = [
  {
    name: "WhatsApp",
    limit: "16 MB",
    quality: "Compressed",
    resume: "No",
    color: "#25D366",
  },
  {
    name: "Email",
    limit: "25 MB",
    quality: "Limited",
    resume: "No",
    color: "#EA4335",
  },
  {
    name: "WeTransfer",
    limit: "2 GB",
    quality: "Original",
    resume: "No",
    color: "#409FFF",
  },
  {
    name: "NaijaTransfer",
    limit: "4 GB FREE",
    quality: "Original",
    resume: "Yes",
    color: BRAND_BLUE,
    highlight: true,
  },
];

export const ComparisonScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleProgress = spring({ frame, fps, config: { damping: 200 } });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: CHARCOAL,
        justifyContent: "center",
        alignItems: "center",
        padding: 40,
      }}
    >
      <div
        style={{
          opacity: titleProgress,
          fontSize: 40,
          fontFamily: FONT,
          fontWeight: 700,
          color: "#ffffff",
          textAlign: "center",
          marginBottom: 40,
        }}
      >
        How we <span style={{ color: BRAND_BLUE }}>compare</span>
      </div>

      {/* Header row */}
      <div
        style={{
          display: "flex",
          width: "100%",
          padding: "12px 16px",
          gap: 8,
          opacity: titleProgress,
        }}
      >
        <div style={{ flex: 2.5, fontFamily: FONT, fontSize: 20, fontWeight: 700, color: "rgba(255,255,255,0.4)" }}>Service</div>
        <div style={{ flex: 1.5, fontFamily: FONT, fontSize: 20, fontWeight: 700, color: "rgba(255,255,255,0.4)", textAlign: "center" }}>Limit</div>
        <div style={{ flex: 1.5, fontFamily: FONT, fontSize: 20, fontWeight: 700, color: "rgba(255,255,255,0.4)", textAlign: "center" }}>Quality</div>
        <div style={{ flex: 1.5, fontFamily: FONT, fontSize: 20, fontWeight: 700, color: "rgba(255,255,255,0.4)", textAlign: "center" }}>Resume</div>
      </div>

      {/* Rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
        {competitors.map((c, i) => {
          const rowProgress = spring({
            frame: frame - (0.4 + i * 0.4) * fps,
            fps,
            config: { damping: 200 },
          });
          const opacity = interpolate(rowProgress, [0, 1], [0, 1]);
          const translateY = interpolate(rowProgress, [0, 1], [20, 0]);

          // NaijaTransfer row gets a highlight pulse
          const highlightOpacity = c.highlight
            ? interpolate(frame % (1.5 * fps), [0, 0.75 * fps, 1.5 * fps], [0.05, 0.15, 0.05])
            : 0;

          return (
            <div
              key={i}
              style={{
                opacity,
                transform: `translateY(${translateY}px)`,
                display: "flex",
                width: "100%",
                padding: "18px 16px",
                gap: 8,
                borderRadius: 14,
                backgroundColor: c.highlight
                  ? `${BRAND_BLUE}15`
                  : "rgba(255,255,255,0.03)",
                border: c.highlight
                  ? `2px solid ${BRAND_BLUE}50`
                  : "1px solid rgba(255,255,255,0.06)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Highlight glow */}
              {c.highlight && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: BRAND_BLUE,
                    opacity: highlightOpacity,
                    borderRadius: 14,
                  }}
                />
              )}

              <div style={{ flex: 2.5, display: "flex", alignItems: "center", gap: 10, zIndex: 1 }}>
                <div style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c.color }} />
                <span
                  style={{
                    fontFamily: FONT,
                    fontSize: 26,
                    fontWeight: c.highlight ? 900 : 500,
                    color: c.highlight ? BRAND_BLUE : "#ffffff",
                  }}
                >
                  {c.name}
                </span>
              </div>
              <div
                style={{
                  flex: 1.5,
                  fontFamily: FONT,
                  fontSize: 24,
                  fontWeight: c.highlight ? 700 : 400,
                  color: c.highlight ? "#ffffff" : "rgba(255,255,255,0.7)",
                  textAlign: "center",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 1,
                }}
              >
                {c.limit}
              </div>
              <div
                style={{
                  flex: 1.5,
                  fontFamily: FONT,
                  fontSize: 24,
                  fontWeight: 400,
                  color: c.quality === "Compressed" || c.quality === "Limited"
                    ? ERROR_RED
                    : "#4ade80",
                  textAlign: "center",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 1,
                }}
              >
                {c.quality}
              </div>
              <div
                style={{
                  flex: 1.5,
                  fontFamily: FONT,
                  fontSize: 24,
                  fontWeight: 400,
                  color: c.resume === "Yes" ? "#4ade80" : ERROR_RED,
                  textAlign: "center",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 1,
                }}
              >
                {c.resume === "Yes" ? "✓" : "✗"}
              </div>
            </div>
          );
        })}
      </div>

      {/* Winner badge */}
      <div
        style={{
          marginTop: 30,
          opacity: interpolate(frame, [2.5 * fps, 3 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          transform: `scale(${spring({ frame: frame - 2.5 * fps, fps, config: { damping: 12 } })})`,
          padding: "14px 36px",
          borderRadius: 50,
          backgroundColor: BRAND_BLUE,
        }}
      >
        <span style={{ fontFamily: FONT, fontSize: 26, fontWeight: 700, color: "#ffffff" }}>
          Clear winner 🏆
        </span>
      </div>
    </AbsoluteFill>
  );
};
