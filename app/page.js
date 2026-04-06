"use client";
import { useMemo, useState } from "react";

// ─── Time Parsing ────────────────────────────────────────────────────────────
// Accepts:
//   "4:17.55"  → 257.55s
//   "41755"    → 257.55s  (4 min, 17 sec, 55 hundredths)
//   "421755"   → 2537.55s (42 min, 17 sec, 55 hundredths — for long pieces)
function parseTime(input) {
  if (!input) return null;
  const cleaned = input.trim();

  // Format with colon: m:ss.hh or mm:ss.hh
  if (cleaned.includes(":")) {
    const [minPart, secPart] = cleaned.split(":");
    const minutes = Number(minPart);
    const seconds = Number(secPart);
    if (isNaN(minutes) || isNaN(seconds)) return null;
    return minutes * 60 + seconds;
  }

  // Shorthand: last 4 digits = SS.HH, everything before = minutes
  const digits = cleaned.replace(/\D/g, "");
  if (digits.length >= 5) {
    const hundredths = Number(digits.slice(-2)) / 100;
    const secs = Number(digits.slice(-4, -2));
    const mins = Number(digits.slice(0, -4));
    if (isNaN(mins) || isNaN(secs) || isNaN(hundredths)) return null;
    if (secs >= 60) return null; // invalid
    return mins * 60 + secs + hundredths;
  }

  // No fallback — partial inputs (e.g. "4", "42") return null
  // and do not trigger a result until a complete time is entered.
  return null;
}

// ─── Formatting ──────────────────────────────────────────────────────────────
function formatTime(totalSeconds) {
  const abs = Math.abs(totalSeconds);
  const mins = Math.floor(abs / 60);
  const secs = (abs % 60).toFixed(2).padStart(5, "0");
  return `${mins}:${secs}`;
}

function formatDiff(seconds) {
  const abs = Math.abs(seconds).toFixed(2);
  return seconds >= 0 ? `+${abs}s` : `−${abs}s`;
}

// ─── Seat Race Calculation ───────────────────────────────────────────────────
// Method: UW Addition (total time comparison)
// Each athlete's piece times are summed. Lower total = faster = winner.
// This is mathematically identical to the margin-subtraction method and
// correctly accounts for both boats slowing down or speeding up after the swap.
//
// Variables:
//   a1 = Athlete A time, Piece 1  (A is in Boat 1)
//   b1 = Athlete B time, Piece 1  (B is in Boat 2)
//   a2 = Athlete A time, Piece 2  (A is now in Boat 2 — after swap)
//   b2 = Athlete B time, Piece 2  (B is now in Boat 1 — after swap)
//
// net = (B total) − (A total). Positive → A wins. Negative → B wins.

function calcResult(a1, b1, a2, b2) {
  const totalA = a1 + a2;
  const totalB = b1 + b2;
  const net = totalB - totalA; // positive = A wins (lower total time)
  const absNet = Math.abs(net);

  // Piece margins (which athlete's boat was faster in each piece)
  // Piece 1: a1 vs b1. Positive margin = A's boat was faster.
  const piece1Margin = b1 - a1;
  // Piece 2: a2 vs b2. Positive margin = A's boat (now Boat 2) was faster.
  const piece2Margin = b2 - a2;

  // Boat speed changes after the swap (for coach context)
  // Boat 1: had A in piece 1 (time = a1), now has B in piece 2 (time = b2)
  const boat1Change = b2 - a1; // positive = Boat 1 slowed when B got in
  // Boat 2: had B in piece 1 (time = b1), now has A in piece 2 (time = a2)
  const boat2Change = a2 - b1; // positive = Boat 2 slowed when A got in

  // Verdict
  const tooClose = absNet < 0.3;
  const winner = tooClose ? null : net > 0 ? "A" : "B";

  let verdict, story;
  if (tooClose) {
    verdict = "Too close to call";
    story =
      "The margin is within statistical noise. A good coach would run additional pieces before drawing a conclusion.";
  } else {
    verdict = `Athlete ${winner} wins by ${absNet.toFixed(2)}s`;
    if (absNet < 1.0) {
      story =
        "A narrow but real result. One athlete edged the other — consider running another seat race to confirm.";
    } else if (absNet < 3.0) {
      story =
        "A clear seat race outcome. One athlete showed a meaningful boat-moving advantage across both pieces.";
    } else {
      story =
        "A decisive result. One athlete demonstrated a strong and convincing advantage in moving the boat.";
    }
  }

  return {
    totalA,
    totalB,
    net,
    absNet,
    winner,
    tooClose,
    piece1Margin,
    piece2Margin,
    boat1Change,
    boat2Change,
    verdict,
    story,
  };
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function Page() {
  const [a1, setA1] = useState("");
  const [b1, setB1] = useState("");
  const [a2, setA2] = useState("");
  const [b2, setB2] = useState("");

  const result = useMemo(() => {
    const pa1 = parseTime(a1);
    const pb1 = parseTime(b1);
    const pa2 = parseTime(a2);
    const pb2 = parseTime(b2);
    if ([pa1, pb1, pa2, pb2].some((v) => v === null)) return null;
    return calcResult(pa1, pb1, pa2, pb2);
  }, [a1, b1, a2, b2]);

  const reset = () => {
    setA1("");
    setB1("");
    setA2("");
    setB2("");
  };

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
        {/* ── Header ── */}
        <section style={{ color: "white", marginBottom: 32 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 16,
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
              }}
            >
              RowLab
            </div>
            <button
              onClick={reset}
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "rgba(255,255,255,0.7)",
                borderRadius: 8,
                padding: "6px 16px",
                fontSize: 13,
                cursor: "pointer",
                letterSpacing: 0.2,
              }}
            >
              Reset
            </button>
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
            Enter times for both pieces. RowLab compares total times — the
            method that catches when both boats slow down after the swap.
          </p>
        </section>

        {/* ── Input Card ── */}
        <section
          style={{
            background: "white",
            borderRadius: 24,
            padding: 28,
            boxShadow: "0 20px 60px rgba(15, 23, 42, 0.12)",
            border: "1px solid rgba(15, 23, 42, 0.06)",
          }}
        >
          {/* Piece 1 */}
          <PieceLabel>Piece 1</PieceLabel>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12,
              marginBottom: 24,
            }}
          >
            <TimeInput
              label="Athlete A"
              value={a1}
              onChange={setA1}
              placeholder="4:17.55 or 41755"
            />
            <TimeInput
              label="Athlete B"
              value={b1}
              onChange={setB1}
              placeholder="4:27.85 or 42785"
            />
          </div>

          {/* Swap divider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 24,
            }}
          >
            <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: 1.2,
                color: "#94a3b8",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}
            >
              ↕ Athletes Swap
            </span>
            <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
          </div>

          {/* Piece 2 */}
          <PieceLabel>Piece 2</PieceLabel>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12,
              marginBottom: 28,
            }}
          >
            <TimeInput
              label="Athlete A"
              value={a2}
              onChange={setA2}
              placeholder="4:27.28 or 42728"
            />
            <TimeInput
              label="Athlete B"
              value={b2}
              onChange={setB2}
              placeholder="4:20.27 or 42027"
            />
          </div>

          {/* ── Result Block ── */}
          <div
            style={{
              padding: 24,
              borderRadius: 20,
              background: result
                ? "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)"
                : "#f8fafc",
              color: result ? "white" : "#0f172a",
              border: result ? "none" : "1px solid #e2e8f0",
              transition: "background 0.3s",
            }}
          >
            {!result ? (
              <EmptyState />
            ) : (
              <ResultBlock result={result} />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PieceLabel({ children }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 1.2,
        color: "#94a3b8",
        textTransform: "uppercase",
        marginBottom: 10,
      }}
    >
      {children}
    </div>
  );
}

function TimeInput({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label
        style={{
          display: "block",
          marginBottom: 8,
          fontSize: 13,
          fontWeight: 500,
          color: "#475569",
        }}
      >
        {label}
      </label>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "14px 16px",
          borderRadius: 14,
          border: "1.5px solid #cbd5e1",
          outline: "none",
          fontSize: 18,
          fontWeight: 500,
          background: "white",
          color: "#0f172a",
          WebkitAppearance: "none",
        }}
      />
    </div>
  );
}

function EmptyState() {
  return (
    <>
      <div style={{ fontSize: 14, color: "#64748b", marginBottom: 8 }}>
        Seat Race Result
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 10 }}>
        Enter all four times
      </div>
      <div style={{ fontSize: 15, color: "#64748b", lineHeight: 1.6 }}>
        RowLab adds each athlete's piece times and compares totals — the
        method that correctly accounts for both boats speeding up or slowing
        down after the swap.
      </div>
    </>
  );
}

function ResultBlock({ result }) {
  const {
    verdict,
    story,
    totalA,
    totalB,
    absNet,
    tooClose,
    piece1Margin,
    piece2Margin,
    boat1Change,
    boat2Change,
  } = result;

  return (
    <>
      {/* Label */}
      <div
        style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", marginBottom: 8 }}
      >
        Seat Race Result
      </div>

      {/* Primary verdict */}
      <div
        style={{
          fontSize: "clamp(26px, 4vw, 40px)",
          fontWeight: 700,
          letterSpacing: -0.8,
          marginBottom: 10,
          lineHeight: 1.1,
        }}
      >
        {verdict}
      </div>

      {/* Story */}
      <p
        style={{
          margin: "0 0 22px",
          fontSize: 15,
          lineHeight: 1.7,
          color: "rgba(255,255,255,0.78)",
          maxWidth: 680,
        }}
      >
        {story}
      </p>

      {/* Total times */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <MetricCard
          label="Athlete A Total"
          value={formatTime(totalA)}
          sub={null}
        />
        <MetricCard
          label="Athlete B Total"
          value={formatTime(totalB)}
          sub={null}
        />
      </div>

      {/* Piece-by-piece breakdown */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.1)",
          paddingTop: 16,
          display: "grid",
          gap: 8,
        }}
      >
        <BreakdownRow
          label="Piece 1"
          detail={`Athlete ${piece1Margin >= 0 ? "A" : "B"}'s boat faster by ${Math.abs(piece1Margin).toFixed(2)}s`}
        />
        <BreakdownRow
          label="Piece 2 (after swap)"
          detail={`Athlete ${piece2Margin >= 0 ? "A" : "B"}'s boat faster by ${Math.abs(piece2Margin).toFixed(2)}s`}
        />
        <div
          style={{
            marginTop: 4,
            borderTop: "1px solid rgba(255,255,255,0.07)",
            paddingTop: 12,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 1,
              color: "rgba(255,255,255,0.4)",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Boat Speed After Swap
          </div>
          <BreakdownRow
            label="A's boat (now with B)"
            detail={
              boat1Change > 0
                ? `${boat1Change.toFixed(2)}s slower`
                : `${Math.abs(boat1Change).toFixed(2)}s faster`
            }
            highlight={boat1Change > 0 ? "slow" : "fast"}
          />
          <BreakdownRow
            label="B's boat (now with A)"
            detail={
              boat2Change > 0
                ? `${boat2Change.toFixed(2)}s slower`
                : `${Math.abs(boat2Change).toFixed(2)}s faster`
            }
            highlight={boat2Change > 0 ? "slow" : "fast"}
          />
        </div>
      </div>
    </>
  );
}

function MetricCard({ label, value }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.07)",
        borderRadius: 14,
        padding: "14px 16px",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: "rgba(255,255,255,0.55)",
          marginBottom: 6,
          fontWeight: 500,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function BreakdownRow({ label, detail, highlight }) {
  const color =
    highlight === "slow"
      ? "rgba(251,191,103,0.9)"
      : highlight === "fast"
      ? "rgba(110,231,183,0.9)"
      : "rgba(255,255,255,0.6)";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: 13,
        marginBottom: 4,
      }}
    >
      <span style={{ color: "rgba(255,255,255,0.5)" }}>{label}</span>
      <span style={{ color, fontWeight: 500 }}>{detail}</span>
    </div>
  );
}
