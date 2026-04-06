"use client";

import { useMemo, useState } from "react";

function parseTime(input) {
  if (!input) return null;
  const cleaned = input.trim();

  if (cleaned.includes(":")) {
    const [minPart, secPart] = cleaned.split(":");
    const minutes = Number(minPart);
    const seconds = Number(secPart);
    if (Number.isNaN(minutes) || Number.isNaN(seconds)) return null;
    return minutes * 60 + seconds;
  }

  const value = Number(cleaned);
  return Number.isNaN(value) ? null : value;
}

function formatSeconds(value) {
  return `${Math.abs(value).toFixed(2)}s`;
}

function verdictText(net) {
  const abs = Math.abs(net);
  if (abs < 0.3) return "Too close to call";
  return net < 0 ? "Athlete A wins" : "Athlete B wins";
}

function storyText(net) {
  const abs = Math.abs(net);

  if (abs < 0.3) {
    return "This seat race was effectively even. The margin is small enough that a coach would likely want more pieces or additional context before calling a winner.";
  }

  if (abs < 1.0) {
    return "This was a narrow but meaningful result. One athlete edged the other, but the race remained highly competitive.";
  }

  if (abs < 2.5) {
    return "This was a clear seat race outcome. One athlete showed a noticeable boat-moving advantage across the comparison.";
  }

  return "This was a decisive result. One athlete demonstrated a strong and convincing advantage in the seat race.";
}

export default function Page() {
  const [athleteA1, setAthleteA1] = useState("");
  const [athleteA2, setAthleteA2] = useState("");
  const [athleteB1, setAthleteB1] = useState("");
  const [athleteB2, setAthleteB2] = useState("");

  const result = useMemo(() => {
    const a1 = parseTime(athleteA1);
    const a2 = parseTime(athleteA2);
    const b1 = parseTime(athleteB1);
    const b2 = parseTime(athleteB2);

    if ([a1, a2, b1, b2].some((v) => v === null)) return null;

    const athleteADelta = a2 - a1;
    const athleteBDelta = b2 - b1;
    const net = athleteADelta - athleteBDelta;

    return {
      athleteADelta,
      athleteBDelta,
      net,
      verdict: verdictText(net),
      story: storyText(net),
    };
  }, [athleteA1, athleteA2, athleteB1, athleteB2]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #0b1020 0%, #111827 45%, #f8fafc 45%, #f8fafc 100%)",
        padding: "40px 20px 80px",
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <section
          style={{
            color: "white",
            marginBottom: 32,
          }}
        >
          <div
            style={{
              display: "inline-block",
              padding: "6px 12px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.08)",
              fontSize: 13,
              letterSpacing: 0.2,
              marginBottom: 16,
            }}
          >
            RowLab
          </div>

          <h1
            style={{
              fontSize: "clamp(36px, 6vw, 64px)",
              lineHeight: 1,
              margin: "0 0 12px",
              fontWeight: 700,
              letterSpacing: -1.5,
            }}
          >
            Settle seat races fast.
          </h1>

          <p
            style={{
              fontSize: 18,
              lineHeight: 1.6,
              color: "rgba(255,255,255,0.78)",
              maxWidth: 720,
              margin: 0,
            }}
          >
            RowLab helps rowers and coaches calculate seat race outcomes clearly,
            quickly, and consistently — with a result you can actually interpret.
          </p>
        </section>

        <section
          style={{
            background: "white",
            borderRadius: 24,
            padding: 24,
            boxShadow: "0 20px 60px rgba(15, 23, 42, 0.12)",
            border: "1px solid rgba(15, 23, 42, 0.06)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 20,
            }}
          >
            <div
              style={{
                background: "#f8fafc",
                borderRadius: 20,
                padding: 20,
                border: "1px solid #e2e8f0",
              }}
            >
              <h2
                style={{
                  margin: "0 0 6px",
                  fontSize: 22,
                  color: "#0f172a",
                }}
              >
                Athlete A
              </h2>
              <p style={{ margin: "0 0 18px", color: "#64748b", fontSize: 14 }}>
                Enter both piece times for Athlete A.
              </p>

              <label style={{ display: "block", marginBottom: 8, fontSize: 13, color: "#475569" }}>
                Piece 1
              </label>
              <input
                value={athleteA1}
                onChange={(e) => setAthleteA1(e.target.value)}
                placeholder="4:25.23"
                style={inputStyle}
              />

              <label
                style={{
                  display: "block",
                  marginTop: 14,
                  marginBottom: 8,
                  fontSize: 13,
                  color: "#475569",
                }}
              >
                Piece 2
              </label>
              <input
                value={athleteA2}
                onChange={(e) => setAthleteA2(e.target.value)}
                placeholder="4:29.44"
                style={inputStyle}
              />
            </div>

            <div
              style={{
                background: "#f8fafc",
                borderRadius: 20,
                padding: 20,
                border: "1px solid #e2e8f0",
              }}
            >
              <h2
                style={{
                  margin: "0 0 6px",
                  fontSize: 22,
                  color: "#0f172a",
                }}
              >
                Athlete B
              </h2>
              <p style={{ margin: "0 0 18px", color: "#64748b", fontSize: 14 }}>
                Enter both piece times for Athlete B.
              </p>

              <label style={{ display: "block", marginBottom: 8, fontSize: 13, color: "#475569" }}>
                Piece 1
              </label>
              <input
                value={athleteB1}
                onChange={(e) => setAthleteB1(e.target.value)}
                placeholder="4:28.48"
                style={inputStyle}
              />

              <label
                style={{
                  display: "block",
                  marginTop: 14,
                  marginBottom: 8,
                  fontSize: 13,
                  color: "#475569",
                }}
              >
                Piece 2
              </label>
              <input
                value={athleteB2}
                onChange={(e) => setAthleteB2(e.target.value)}
                placeholder="4:26.07"
                style={inputStyle}
              />
            </div>
          </div>

          <div
            style={{
              marginTop: 24,
              padding: 24,
              borderRadius: 20,
              background: result
                ? "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)"
                : "#f8fafc",
              color: result ? "white" : "#0f172a",
              border: result ? "none" : "1px solid #e2e8f0",
            }}
          >
            {!result ? (
              <>
                <div style={{ fontSize: 14, color: "#64748b", marginBottom: 8 }}>
                  Seat Race Result
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
                  Enter all four times
                </div>
                <div style={{ fontSize: 15, color: "#64748b", lineHeight: 1.6 }}>
                  RowLab uses net delta logic to compare how each athlete moved the
                  boat across the paired pieces.
                </div>
              </>
            ) : (
              <>
                <div
                  style={{
                    fontSize: 14,
                    color: "rgba(255,255,255,0.72)",
                    marginBottom: 8,
                  }}
                >
                  Seat Race Result
                </div>

                <div
                  style={{
                    fontSize: "clamp(28px, 4vw, 42px)",
                    fontWeight: 700,
                    marginBottom: 10,
                    letterSpacing: -0.8,
                  }}
                >
                  {result.verdict}
                </div>

                <div
                  style={{
                    display: "inline-block",
                    padding: "8px 12px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.08)",
                    fontSize: 15,
                    marginBottom: 18,
                  }}
                >
                  Margin: {formatSeconds(result.net)}
                </div>

                <p
                  style={{
                    margin: 0,
                    fontSize: 16,
                    lineHeight: 1.7,
                    color: "rgba(255,255,255,0.86)",
                    maxWidth: 720,
                  }}
                >
                  {result.story}
                </p>

                <div
                  style={{
                    marginTop: 22,
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: 14,
                  }}
                >
                  <MetricCard
                    label="Athlete A Delta"
                    value={formatSeconds(result.athleteADelta)}
                  />
                  <MetricCard
                    label="Athlete B Delta"
                    value={formatSeconds(result.athleteBDelta)}
                  />
                  <MetricCard
                    label="Net Delta"
                    value={formatSeconds(result.net)}
                  />
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function MetricCard({ label, value }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.08)",
        borderRadius: 16,
        padding: 16,
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        style={{
          fontSize: 13,
          color: "rgba(255,255,255,0.68)",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "14px 16px",
  borderRadius: 14,
  border: "1px solid #cbd5e1",
  outline: "none",
  fontSize: 16,
  background: "white",
};
