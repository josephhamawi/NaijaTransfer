import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Img,
  staticFile,
} from "remotion";
import { FONT, BRAND_BLUE, CHARCOAL, GOLD } from "../theme";

export const FeatureNigeriaScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const flagProgress = spring({ frame, fps, config: { damping: 200 } });

  const tiers = [
    { name: "Free", price: "₦0", desc: "4GB, no account needed", color: BRAND_BLUE },
    { name: "Pro", price: "₦2,000", desc: "10GB, no ads, 30-day", color: "#3b82f6" },
    { name: "Business", price: "₦10,000", desc: "50GB, branding, API", color: GOLD },
  ];

  // Phone with pricing page
  const phoneScale = spring({
    frame: frame - 0.5 * fps,
    fps,
    config: { damping: 200 },
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: CHARCOAL,
        justifyContent: "center",
        alignItems: "center",
        padding: 50,
      }}
    >
      {/* Nigerian flag bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 6, display: "flex" }}>
        <div style={{ flex: 1, backgroundColor: "#008751", opacity: flagProgress }} />
        <div style={{ flex: 1, backgroundColor: "#ffffff", opacity: flagProgress }} />
        <div style={{ flex: 1, backgroundColor: "#008751", opacity: flagProgress }} />
      </div>

      <div
        style={{
          opacity: flagProgress,
          fontSize: 42,
          fontFamily: FONT,
          fontWeight: 700,
          color: "#ffffff",
          textAlign: "center",
          marginBottom: 10,
        }}
      >
        Built in Nigeria 🇳🇬
      </div>
      <div
        style={{
          opacity: flagProgress,
          fontSize: 30,
          fontFamily: FONT,
          fontWeight: 400,
          color: "rgba(255,255,255,0.5)",
          textAlign: "center",
          marginBottom: 36,
        }}
      >
        All prices in Naira
      </div>

      {/* Pricing tiers */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>
        {tiers.map((tier, i) => {
          const tierProgress = spring({
            frame: frame - (0.8 + i * 0.35) * fps,
            fps,
            config: { damping: 200 },
          });
          const opacity = interpolate(tierProgress, [0, 1], [0, 1]);
          const translateY = interpolate(tierProgress, [0, 1], [20, 0]);

          return (
            <div
              key={i}
              style={{
                opacity,
                transform: `translateY(${translateY}px)`,
                padding: "24px 28px",
                borderRadius: 18,
                backgroundColor: `${tier.color}10`,
                border: `1px solid ${tier.color}25`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontFamily: FONT, fontSize: 30, fontWeight: 700, color: tier.color }}>
                  {tier.name}
                </div>
                <div style={{ fontFamily: FONT, fontSize: 20, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
                  {tier.desc}
                </div>
              </div>
              <div style={{ fontFamily: FONT, fontSize: 34, fontWeight: 900, color: "#ffffff" }}>
                {tier.price}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 24,
          opacity: interpolate(frame, [2.2 * fps, 2.7 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          fontFamily: FONT,
          fontSize: 24,
          color: "rgba(255,255,255,0.4)",
          textAlign: "center",
        }}
      >
        Card, bank transfer, or USSD via Paystack
      </div>
    </AbsoluteFill>
  );
};
