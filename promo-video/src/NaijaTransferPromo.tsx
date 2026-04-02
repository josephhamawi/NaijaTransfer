import { AbsoluteFill, Series, Sequence, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import { FONT, CHARCOAL } from "./theme";
import { HookScene } from "./scenes/HookScene";
import { ProblemScene } from "./scenes/ProblemScene";
import { ComparisonScene } from "./scenes/ComparisonScene";
import { LogoRevealScene } from "./scenes/LogoRevealScene";
import { AppShowcaseScene } from "./scenes/AppShowcaseScene";
import { FeatureSecurityScene } from "./scenes/FeatureSecurityScene";
import { FeatureNigeriaScene } from "./scenes/FeatureNigeriaScene";
import { CTAScene } from "./scenes/CTAScene";

// Scene durations in frames (30fps) — matched to actual voiceover audio lengths + 0.5s buffer
// Audio durations: hook=6.3s, problem=8.0s, comparison=6.9s, reveal=2.8s,
//                  showcase=8.1s, security=7.7s, nigeria=8.1s, cta=6.2s
export const SCENE_DURATIONS = {
  hook: 204,        // 6.8s  (vo: 6.3s + 0.5s buffer)
  problem: 255,     // 8.5s  (vo: 8.0s + 0.5s buffer)
  comparison: 222,  // 7.4s  (vo: 6.9s + 0.5s buffer)
  logoReveal: 99,   // 3.3s  (vo: 2.8s + 0.5s buffer)
  appShowcase: 258, // 8.6s  (vo: 8.1s + 0.5s buffer)
  security: 246,    // 8.2s  (vo: 7.7s + 0.5s buffer)
  nigeria: 258,     // 8.6s  (vo: 8.1s + 0.5s buffer)
  cta: 201,         // 6.7s  (vo: 6.2s + 0.5s buffer)
};

export const NaijaTransferPromo = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: CHARCOAL, fontFamily: FONT }}>
      {/* Background music — very low volume, doesn't compete with voice */}
      <Audio src={staticFile("audio/bg-music.mp3")} volume={0.08} loop />

      <Series>
        <Series.Sequence durationInFrames={SCENE_DURATIONS.hook}>
          <HookScene />
          <Sequence from={8} layout="none">
            <Audio src={staticFile("audio/vo-hook.mp3")} volume={0.95} />
          </Sequence>
        </Series.Sequence>

        <Series.Sequence durationInFrames={SCENE_DURATIONS.problem}>
          <ProblemScene />
          <Sequence from={8} layout="none">
            <Audio src={staticFile("audio/vo-problem.mp3")} volume={0.95} />
          </Sequence>
        </Series.Sequence>

        <Series.Sequence durationInFrames={SCENE_DURATIONS.comparison}>
          <ComparisonScene />
          <Sequence from={8} layout="none">
            <Audio src={staticFile("audio/vo-comparison.mp3")} volume={0.95} />
          </Sequence>
        </Series.Sequence>

        <Series.Sequence durationInFrames={SCENE_DURATIONS.logoReveal}>
          <LogoRevealScene />
          <Sequence from={5} layout="none">
            <Audio src={staticFile("audio/vo-reveal.mp3")} volume={0.95} />
          </Sequence>
          <Sequence from={0} layout="none">
            <Audio src={staticFile("audio/sfx-whoosh.mp3")} volume={0.3} />
          </Sequence>
        </Series.Sequence>

        <Series.Sequence durationInFrames={SCENE_DURATIONS.appShowcase}>
          <AppShowcaseScene />
          <Sequence from={8} layout="none">
            <Audio src={staticFile("audio/vo-showcase.mp3")} volume={0.95} />
          </Sequence>
        </Series.Sequence>

        <Series.Sequence durationInFrames={SCENE_DURATIONS.security}>
          <FeatureSecurityScene />
          <Sequence from={8} layout="none">
            <Audio src={staticFile("audio/vo-security.mp3")} volume={0.95} />
          </Sequence>
        </Series.Sequence>

        <Series.Sequence durationInFrames={SCENE_DURATIONS.nigeria}>
          <FeatureNigeriaScene />
          <Sequence from={8} layout="none">
            <Audio src={staticFile("audio/vo-nigeria.mp3")} volume={0.95} />
          </Sequence>
        </Series.Sequence>

        <Series.Sequence durationInFrames={SCENE_DURATIONS.cta}>
          <CTAScene />
          <Sequence from={8} layout="none">
            <Audio src={staticFile("audio/vo-cta.mp3")} volume={0.95} />
          </Sequence>
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
