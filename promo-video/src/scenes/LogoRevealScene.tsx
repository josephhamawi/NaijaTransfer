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

export const LogoRevealScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 12 } });

  const textOpacity = interpolate(frame, [0.4 * fps, 0.8 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const textY = interpolate(frame, [0.4 * fps, 0.8 * fps], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const subtitleOpacity = interpolate(frame, [0.9 * fps, 1.3 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const glowOpacity = interpolate(frame, [0, 0.3 * fps, 0.8 * fps], [0, 0.5, 0.2], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: CHARCOAL,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Blue glow behind logo */}
      <div
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${BRAND_BLUE}50 0%, transparent 70%)`,
          opacity: glowOpacity,
        }}
      />

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
        <div style={{ transform: `scale(${logoScale})` }}>
          <Img src={staticFile("logo.png")} style={{ width: 150, height: 150 }} />
        </div>

        <div style={{ opacity: textOpacity, transform: `translateY(${textY}px)`, textAlign: "center" }}>
          <span style={{ fontSize: 60, fontFamily: FONT, fontWeight: 900, color: BRAND_BLUE }}>
            Naija
          </span>
          <span style={{ fontSize: 60, fontFamily: FONT, fontWeight: 300, color: "#ffffff" }}>
            Transfer
          </span>
        </div>

        <div
          style={{
            opacity: subtitleOpacity,
            fontSize: 30,
            fontFamily: FONT,
            fontWeight: 400,
            color: "rgba(255,255,255,0.6)",
            textAlign: "center",
          }}
        >
          Send large files. No wahala.
        </div>
      </div>
    </AbsoluteFill>
  );
};
