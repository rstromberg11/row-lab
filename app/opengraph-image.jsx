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
            padding: "8px 18px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.10)",
            fontSize: 20,
            color: "rgba(255,255,255,0.65)",
            marginBottom: 36,
            letterSpacing: 1,
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
            marginBottom: 28,
            letterSpacing: -2,
          }}
        >
          Settle seat races fast.
        </div>

        {/* Subline */}
        <div
          style={{
            fontSize: 30,
            color: "rgba(255,255,255,0.60)",
            lineHeight: 1.55,
            maxWidth: 860,
          }}
        >
          Enter times for both pieces. RowLab compares each athlete's total
          time — not just who crossed first.
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
