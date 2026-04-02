import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";
import { FONT, CHARCOAL, ERROR_RED, BRAND_BLUE } from "../theme";

export const HookScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const line1Opacity = interpolate(frame, [0, 0.4 * fps], [0, 1], {
    extrapolateRight: "clamp",
  });
  const line1Y = interpolate(frame, [0, 0.4 * fps], [40, 0], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const line2Opacity = interpolate(frame, [0.8 * fps, 1.2 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const line2Y = interpolate(frame, [0.8 * fps, 1.2 * fps], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const emojiScale = spring({
    frame: frame - 1.8 * fps,
    fps,
    config: { damping: 8 },
  });

  // Subtle animated background pulse
  const pulseOpacity = interpolate(
    frame % (1 * fps),
    [0, 0.5 * fps, 1 * fps],
    [0.05, 0.15, 0.05]
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: CHARCOAL,
        justifyContent: "center",
        alignItems: "center",
        padding: 60,
      }}
    >
      {/* Subtle gradient accent */}
      <div
        style={{
          position: "absolute",
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${ERROR_RED}30 0%, transparent 70%)`,
          top: 300,
          right: -200,
          opacity: pulseOpacity,
        }}
      />

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 40 }}>
        <div
          style={{
            opacity: line1Opacity,
            transform: `translateY(${line1Y}px)`,
            fontSize: 54,
            fontFamily: FONT,
            fontWeight: 700,
            color: "#ffffff",
            textAlign: "center",
            lineHeight: 1.3,
          }}
        >
          Tired of WhatsApp{"\n"}
          <span style={{ color: ERROR_RED }}>destroying</span> your files?
        </div>

        <div
          style={{
            opacity: line2Opacity,
            transform: `translateY(${line2Y}px)`,
            fontSize: 44,
            fontFamily: FONT,
            fontWeight: 400,
            color: "rgba(255,255,255,0.7)",
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          Email caps you at <span style={{ color: ERROR_RED, fontWeight: 700 }}>25MB</span>
        </div>

        <div style={{ transform: `scale(${emojiScale})`, fontSize: 100 }}>
          😤
        </div>
      </div>
    </AbsoluteFill>
  );
};
