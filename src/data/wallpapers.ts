import type { Wallpaper } from "@/types";

export type WallpaperWithGradient = Wallpaper & { gradient: string };

/**
 * Live wallpapers shown behind the upload widget. Imported by
 * BackgroundWallpaper (the rotator) and by /artists (the credits page),
 * so both stay in sync when a wallpaper is added or swapped out.
 */
export const WALLPAPERS: WallpaperWithGradient[] = [
  {
    id: "1",
    imageUrl: "/wallpapers/lagos-skyline.jpg",
    gradient: "linear-gradient(135deg, #4EA8DE 0%, #1A1A2E 50%, #2E86C1 100%)",
    artistName: "Babatunde Olajide",
    artworkTitle: "Lagos Skyline",
    artistUrl: "https://unsplash.com/@spicyboggy",
  },
  {
    id: "2",
    imageUrl: "/wallpapers/lagos-market.jpg",
    gradient: "linear-gradient(135deg, #2a6f4e 0%, #1A1A2E 60%, #4EA8DE 100%)",
    artistName: "David Iloba",
    artworkTitle: "Lagos Market",
    artistUrl: "https://www.pexels.com/@david-iloba-28486424/",
  },
  {
    id: "3",
    imageUrl: "/wallpapers/lagos-street.jpg",
    gradient: "linear-gradient(160deg, #3a5f3a 0%, #1A1A2E 50%, #2E86C1 100%)",
    artistName: "Olarotimi Awolaja",
    artworkTitle: "Lagos Crossroads",
    artistUrl: "",
  },
  {
    id: "4",
    imageUrl: "/wallpapers/lagos-trucks.jpg",
    gradient: "linear-gradient(120deg, #8B7355 0%, #1A1A2E 60%, #4a6741 100%)",
    artistName: "David Iloba",
    artworkTitle: "Lagos Workers",
    artistUrl: "https://www.pexels.com/@david-iloba-28486424/",
  },
  {
    id: "5",
    imageUrl: "/wallpapers/fulani-cattle.jpg",
    gradient: "linear-gradient(135deg, #8B7355 0%, #1A1A2E 50%, #5c4a32 100%)",
    artistName: "mg shotz",
    artworkTitle: "Fulani Herders",
    artistUrl: "",
  },
];
