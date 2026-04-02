import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";
import { FONT, GREEN, DARK_BG } from "../theme";

export const FeatureUploadScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleProgress = spring({ frame, fps, config: { damping: 200 } });

  // Animated progress bar
  const progressWidth = interpolate(frame, [0.5 * fps, 3 * fps], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const sizeText = interpolate(frame, [0.5 * fps, 3 * fps], [0, 4], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const badgeScale = spring({
    frame: frame - 2 * fps,
    fps,
    config: { damping: 8 },
  });

  const feature1Opacity = spring({
    frame: frame - 1.5 * fps,
    fps,
    config: { damping: 200 },
  });

  const feature2Opacity = spring({
    frame: frame - 2.2 * fps,
    fps,
    config: { damping: 200 },
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: DARK_BG,
        justifyContent: "center",
        alignItems: "center",
        padding: 60,
      }}
    >
      {/* Green accent line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 6,
          background: `linear-gradient(90deg, ${GREEN}, #00c853)`,
        }}
      />

      <div
        style={{
          opacity: titleProgress,
          fontSize: 44,
          fontFamily: FONT,
          fontWeight: 700,
          color: "#ffffff",
          textAlign: "center",
          marginBottom: 50,
        }}
      >
        Upload up to{" "}
        <span style={{ color: GREEN, fontSize: 56 }}>4 GB</span>
        {"\n"}for FREE
      </div>

      {/* Upload progress simulation */}
      <div
        style={{
          width: "100%",
          padding: "32px",
          borderRadius: 24,
          backgroundColor: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          marginBottom: 40,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <span style={{ fontFamily: FONT, fontSize: 28, color: "#ffffff", fontWeight: 500 }}>
            project-files.zip
          </span>
          <span style={{ fontFamily: FONT, fontSize: 28, color: GREEN, fontWeight: 700 }}>
            {sizeText.toFixed(1)} GB
          </span>
        </div>

        <div
          style={{
            width: "100%",
            height: 16,
            borderRadius: 8,
            backgroundColor: "rgba(255,255,255,0.1)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progressWidth}%`,
              height: "100%",
              borderRadius: 8,
              background: `linear-gradient(90deg, ${GREEN}, #00c853)`,
            }}
          />
        </div>

        <div
          style={{
            textAlign: "right",
            marginTop: 8,
            fontFamily: FONT,
            fontSize: 24,
            color: "rgba(255,255,255,0.5)",
          }}
        >
          {Math.round(progressWidth)}%
        </div>
      </div>

      {/* Badge */}
      <div
        style={{
          transform: `scale(${badgeScale})`,
          padding: "16px 40px",
          borderRadius: 50,
          backgroundColor: GREEN,
          marginBottom: 40,
        }}
      >
        <span style={{ fontFamily: FONT, fontSize: 28, fontWeight: 700, color: "#ffffff" }}>
          No account needed
        </span>
      </div>

      {/* Features */}
      <div style={{ display: "flex", gap: 20, width: "100%" }}>
        <div
          style={{
            opacity: feature1Opacity,
            flex: 1,
            padding: 24,
            borderRadius: 16,
            backgroundColor: "rgba(0,135,81,0.1)",
            border: "1px solid rgba(0,135,81,0.2)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 8 }}>⚡</div>
          <span style={{ fontFamily: FONT, fontSize: 24, color: "#ffffff", fontWeight: 500 }}>
            Resumable uploads
          </span>
        </div>
        <div
          style={{
            opacity: feature2Opacity,
            flex: 1,
            padding: 24,
            borderRadius: 16,
            backgroundColor: "rgba(0,135,81,0.1)",
            border: "1px solid rgba(0,135,81,0.2)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 8 }}>🔄</div>
          <span style={{ fontFamily: FONT, fontSize: 24, color: "#ffffff", fontWeight: 500 }}>
            Built for Naija internet
          </span>
        </div>
      </div>

      {/* Transcript */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          left: 40,
          right: 40,
          textAlign: "center",
          fontSize: 28,
          fontFamily: FONT,
          fontWeight: 500,
          color: "rgba(255,255,255,0.5)",
        }}
      >
        Upload up to 4GB for free. No account needed. Resumable uploads built for Nigerian internet.
      </div>
    </AbsoluteFill>
  );
};
