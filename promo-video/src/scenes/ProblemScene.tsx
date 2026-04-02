import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { FONT, CHARCOAL, ERROR_RED } from "../theme";

const problems = [
  { icon: "📸", text: "Photos lose quality" },
  { icon: "🎥", text: "Videos get crushed" },
  { icon: "📁", text: "Large files? Impossible" },
  { icon: "🐌", text: "Naija internet drops out" },
];

export const ProblemScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 0.3 * fps], [0, 1], {
    extrapolateRight: "clamp",
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
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 5,
          background: `linear-gradient(90deg, ${ERROR_RED}, #ff6b5a)`,
        }}
      />

      <div
        style={{
          opacity: titleOpacity,
          fontSize: 46,
          fontFamily: FONT,
          fontWeight: 700,
          color: ERROR_RED,
          textAlign: "center",
          marginBottom: 50,
        }}
      >
        Sound familiar?
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 28, width: "100%" }}>
        {problems.map((p, i) => {
          const itemProgress = spring({
            frame: frame - (0.3 + i * 0.35) * fps,
            fps,
            config: { damping: 200 },
          });
          const opacity = interpolate(itemProgress, [0, 1], [0, 1]);
          const translateX = interpolate(itemProgress, [0, 1], [-60, 0]);

          // Strike through animation
          const strikeWidth = interpolate(
            frame,
            [(1.5 + i * 0.3) * fps, (2 + i * 0.3) * fps],
            [0, 100],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          return (
            <div
              key={i}
              style={{
                opacity,
                transform: `translateX(${translateX}px)`,
                display: "flex",
                alignItems: "center",
                gap: 20,
                padding: "20px 28px",
                borderRadius: 16,
                backgroundColor: "rgba(231,76,60,0.08)",
                border: "1px solid rgba(231,76,60,0.15)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <span style={{ fontSize: 42 }}>{p.icon}</span>
              <span
                style={{
                  fontSize: 34,
                  fontFamily: FONT,
                  fontWeight: 500,
                  color: "#ffffff",
                }}
              >
                {p.text}
              </span>
              {/* Red strike-through */}
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: 20,
                  height: 3,
                  width: `${strikeWidth}%`,
                  backgroundColor: ERROR_RED,
                  transform: "translateY(-50%)",
                }}
              />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
