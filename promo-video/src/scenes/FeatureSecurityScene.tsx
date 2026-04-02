import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { FONT, BRAND_BLUE, CHARCOAL } from "../theme";

const features = [
  { icon: "🔒", title: "Password protection", desc: "Lock any transfer" },
  { icon: "📱", title: "WhatsApp sharing", desc: "Send via WhatsApp, SMS, QR" },
  { icon: "⏰", title: "Auto-expiry", desc: "Files delete automatically" },
  { icon: "💎", title: "Original quality", desc: "Zero compression, ever" },
];

export const FeatureSecurityScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleProgress = spring({ frame, fps, config: { damping: 200 } });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: CHARCOAL,
        justifyContent: "center",
        alignItems: "center",
        padding: 50,
      }}
    >
      <div
        style={{
          opacity: titleProgress,
          fontSize: 44,
          fontFamily: FONT,
          fontWeight: 700,
          color: "#ffffff",
          textAlign: "center",
          marginBottom: 44,
        }}
      >
        Your files, <span style={{ color: BRAND_BLUE }}>your rules</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%" }}>
        {features.map((f, i) => {
          const itemProgress = spring({
            frame: frame - (0.3 + i * 0.45) * fps,
            fps,
            config: { damping: 200 },
          });
          const opacity = interpolate(itemProgress, [0, 1], [0, 1]);
          const scale = interpolate(itemProgress, [0, 1], [0.92, 1]);

          return (
            <div
              key={i}
              style={{
                opacity,
                transform: `scale(${scale})`,
                display: "flex",
                alignItems: "center",
                gap: 20,
                padding: "24px 28px",
                borderRadius: 18,
                backgroundColor: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  backgroundColor: `${BRAND_BLUE}12`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 32,
                  flexShrink: 0,
                }}
              >
                {f.icon}
              </div>
              <div>
                <div style={{ fontFamily: FONT, fontSize: 28, fontWeight: 700, color: "#ffffff", marginBottom: 2 }}>
                  {f.title}
                </div>
                <div style={{ fontFamily: FONT, fontSize: 22, fontWeight: 400, color: "rgba(255,255,255,0.5)" }}>
                  {f.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
