import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 38, background: "linear-gradient(145deg,#8b5cf6,#c026d3 58%,#fb7185)", color: "white", fontSize: 106, fontWeight: 900, letterSpacing: -10, paddingRight: 10 }}>P</div>, size);
}
