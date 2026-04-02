import { Composition } from "remotion";
import { NaijaTransferPromo, SCENE_DURATIONS } from "./NaijaTransferPromo";

const TOTAL_FRAMES = Object.values(SCENE_DURATIONS).reduce((a, b) => a + b, 0);

export const RemotionRoot = () => {
  return (
    <Composition
      id="NaijaTransferPromo"
      component={NaijaTransferPromo}
      durationInFrames={TOTAL_FRAMES}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};
