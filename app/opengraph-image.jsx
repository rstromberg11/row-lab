// app/opengraph-image.jsx
// Next.js App Router automatically serves this as /opengraph-image.png
// and injects the <meta property="og:image"> tag — no manual wiring needed.
//
// iMessage, Slack, Twitter, etc. all read that tag to generate link previews.
import { ImageResponse } from "next/og";
export const runtime = "edge";
export const alt = "RowLab — Seat Race Calculator";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px 90px",
          background: "linear-gradient(135deg, #0b1020 0%, #1e293b 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* RowLab pill badge */}
        <div
          style={{
            display: "flex",
            alignSelf: "flex-start",
            padding: "12px 28px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.12)",
            fontSize: 40,
            fontWeight: 700,
            color: "white",
            marginBottom: 36,
            letterSpacing: 0.5,
          }}
        >
          RowLab
        </div>
        {/* Headline */}
        <div
          style={{
            fontSize: 80,
            fontWeight: 700,
            color: "white",
            lineHeight: 1,
            marginBottom: 24,
            letterSpacing: -2,
          }}
        >
          Settle seat races fast.
        </div>
        {/* Subline */}
        <div
          style={{
            fontSize: 38,
            fontWeight: 500,
            color: "rgba(255,255,255,0.75)",
            lineHeight: 1.45,
            maxWidth: 860,
          }}
        >
          Not just who crossed first — calculates who moved the boat faster.
        </div>
        {/* Bottom accent: small "rowing stroke" divider */}
        <div
          style={{
            position: "absolute",
            bottom: 60,
            right: 90,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 40,
              height: 2,
              background: "rgba(255,255,255,0.18)",
              borderRadius: 2,
            }}
          />
          <div
            style={{
              fontSize: 16,
              color: "rgba(255,255,255,0.30)",
              letterSpacing: 0.5,
            }}
          >
            rowlab.app
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
