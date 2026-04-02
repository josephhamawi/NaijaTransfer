import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Img,
  staticFile,
  Easing,
} from "remotion";
import { FONT, BRAND_BLUE, CHARCOAL } from "../theme";

export const AppShowcaseScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = spring({ frame, fps, config: { damping: 200 } });

  // Phone mockup animation
  const phoneScale = spring({
    frame: frame - 0.3 * fps,
    fps,
    config: { damping: 15 },
  });
  const phoneY = interpolate(phoneScale, [0, 1], [80, 0]);

  // Progress bar inside the "app"
  const uploadProgress = interpolate(frame, [1.5 * fps, 3.5 * fps], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const badge1 = spring({ frame: frame - 2 * fps, fps, config: { damping: 200 } });
  const badge2 = spring({ frame: frame - 2.5 * fps, fps, config: { damping: 200 } });

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
          opacity: titleOpacity,
          fontSize: 40,
          fontFamily: FONT,
          fontWeight: 700,
          color: "#ffffff",
          textAlign: "center",
          marginBottom: 30,
        }}
      >
        Upload up to <span style={{ color: BRAND_BLUE, fontSize: 48 }}>4 GB</span> free
      </div>

      {/* Phone mockup with screenshot */}
      <div
        style={{
          transform: `scale(${phoneScale}) translateY(${phoneY}px)`,
          width: 340,
          borderRadius: 36,
          border: `4px solid rgba(255,255,255,0.15)`,
          overflow: "hidden",
          backgroundColor: "#12121F",
          boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 40px ${BRAND_BLUE}20`,
          position: "relative",
        }}
      >
        <Img
          src={staticFile("screenshots/homepage.png")}
          style={{ width: "100%", display: "block" }}
        />

        {/* Overlay progress bar on the screenshot */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "20px 24px",
            background: "linear-gradient(transparent, rgba(18,18,31,0.95))",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontFamily: FONT, fontSize: 16, color: "#ffffff", fontWeight: 500 }}>
              Uploading...
            </span>
            <span style={{ fontFamily: FONT, fontSize: 16, color: BRAND_BLUE, fontWeight: 700 }}>
              {Math.round(uploadProgress)}%
            </span>
          </div>
          <div
            style={{
              width: "100%",
              height: 8,
              borderRadius: 4,
              backgroundColor: "rgba(255,255,255,0.1)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${uploadProgress}%`,
                height: "100%",
                borderRadius: 4,
                background: `linear-gradient(90deg, ${BRAND_BLUE}, #73bfe8)`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Feature badges below */}
      <div style={{ display: "flex", gap: 16, marginTop: 30 }}>
        <div
          style={{
            opacity: badge1,
            padding: "12px 24px",
            borderRadius: 50,
            backgroundColor: `${BRAND_BLUE}15`,
            border: `1px solid ${BRAND_BLUE}30`,
          }}
        >
          <span style={{ fontFamily: FONT, fontSize: 22, fontWeight: 600, color: BRAND_BLUE }}>
            ⚡ Resumable
          </span>
        </div>
        <div
          style={{
            opacity: badge2,
            padding: "12px 24px",
            borderRadius: 50,
            backgroundColor: `${BRAND_BLUE}15`,
            border: `1px solid ${BRAND_BLUE}30`,
          }}
        >
          <span style={{ fontFamily: FONT, fontSize: 22, fontWeight: 600, color: BRAND_BLUE }}>
            🚫 No account
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
