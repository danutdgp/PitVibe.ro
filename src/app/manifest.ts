import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PitVibe.ro — Piteștiul, mai aproape",
    short_name: "PitVibe.ro",
    description: "Comunitatea locală pentru oameni, povești și ieșiri din Pitești.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0a0811",
    theme_color: "#0a0811",
    orientation: "portrait-primary",
    lang: "ro",
    categories: ["social", "lifestyle"],
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
