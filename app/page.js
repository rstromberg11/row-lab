"use client";
import { useMemo, useState } from "react";

// ── Time parsing (strict — used for live calculation) ────────────────────────
// Only accepts COMPLETE times. Partial inputs return null → no premature calc.
//
//   "4:17.55"  → 257.55   ✓ colon format with decimal
//   "41755"    → 257.55   ✓ 5-digit shorthand
//   "4:17"     → null     ✗ no decimal — incomplete (calc waits for blur)
//   "417"      → null     ✗ 3-digit shorthand — incomplete (calc waits for blur)
//   "4", "42"  → null     ✗ too few digits
function parseTime(input) {
  if (!input) return null;
  const cleaned = input.trim();

  // Colon format — must include a decimal point to be considered complete
  if (cleaned.includes(":")) {
    if (!cleaned.includes(".")) return null; // e.g. "4:17" → wait for blur to add .00
    const [minPart, secPart] = cleaned.split(":");
    const minutes = Number(minPart);
    const seconds = Number(secPart);
    if (isNaN(minutes) || isNaN(seconds)) return null;
    if (secPart.replace(/\D/g, "").length < 2) return null;
    if (seconds >= 60) return null;
    return minutes * 60 + seconds;
  }

  // Digit shorthand — must be exactly 5 digits: m ss hh (minutes always 0–9)
  const digits = cleaned.replace(/\D/g, "");
  if (digits.length === 5) {
    const mins = Number(digits[0]);
    const secs = Number(digits.slice(1, 3));
    const hundredths = Number(digits.slice(3, 5)) / 100;
    if (isNaN(mins) || isNaN(secs) || isNaN(hundredths)) return null;
    if (secs >= 60) return null;
    return mins * 60 + secs + hundredths;
  }

  return null; // incomplete — no calculation
}

// ── Time parsing (permissive — used only for blur reformatting) ───────────────
// Also accepts m:ss without decimal and 3-digit shorthand.
// These are completed to m:ss.00 by formatTime() and written back to the field.
function parseTimePermissive(input) {
  if (!input) return null;
  const cleaned = input.trim();

  if (cleaned.includes(":")) {
    const [minPart, secPart] = cleaned.split(":");
    const minutes = Number(minPart);
    const seconds = Number(secPart);
    if (isNaN(minutes) || isNaN(seconds)) return null;
    if (secPart.replace(/\D/g, "").length < 2) return null;
    if (seconds >= 60) return null;
    return minutes * 60 + seconds;
  }

  const digits = cleaned.replace(/\D/g, "");

  // 3 digits: m ss → e.g. "417" = 4:17.00
  if (digits.length === 3) {
    const mins = Number(digits[0]);
    const secs = Number(digits.slice(1));
    if (isNaN(mins) || isNaN(secs) || secs >= 60) return null;
    return mins * 60 + secs;
  }

  // 5 digits only: m ss hh (minutes always 0–9, seat races never exceed 9 min)
  if (digits.length === 5) {
    const mins = Number(digits[0]);
    const secs = Number(digits.slice(1, 3));
    const hundredths = Number(digits.slice(3, 5)) / 100;
    if (isNaN(mins) || isNaN(secs) || isNaN(hundredths)) return null;
    if (secs >= 60) return null;
    return mins * 60 + secs + hundredths;
  }

  return null;
}

// ── Canonical display format ──────────────────────────────────────────────────
// Formats total seconds → "m:ss.hh"
function formatTime(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = (totalSeconds % 60).toFixed(2).padStart(5, "0");
  return `${mins}:${secs}`;
}

// ── On-blur formatter ─────────────────────────────────────────────────────────
// Uses the permissive parser so "417" and "4:17" both become "4:17.00".
// If the input still can't be parsed (e.g. garbage text), it's left as-is.
function reformatOnBlur(raw) {
  const parsed = parseTimePermissive(raw);
  return parsed !== null ? formatTime(parsed) : raw;
}

// ── Seat race calculation ─────────────────────────────────────────────────────
// UW addition method: sum each athlete's piece times, compare totals.
// Lower total = faster = winner.
// net = totalB − totalA. Positive → A wins. Negative → B wins.
function calcResult(a1, b1, a2, b2) {
  const totalA = a1 + a2;
  const totalB = b1 + b2;
  const net = totalB - totalA;
  const absNet = Math.abs(net);

  const piece1Margin = b1 - a1; // positive = A's boat faster in piece 1
  const piece2Margin = b2 - a2; // positive = A's boat faster in piece 2

  // How each boat changed after the swap
  const boat1Change = b2 - a1; // Boat 1 (was A's): positive = got slower with B
  const boat2Change = a2 - b1; // Boat 2 (was B's): positive = got slower with A

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

// ── Page ──────────────────────────────────────────────────────────────────────
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
            Enter times for both pieces. RowLab compares each athlete's total
            time — not just who crossed first.
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
            <TimeInput label="Athlete A" value={a1} onChange={setA1} />
            <TimeInput label="Athlete B" value={b1} onChange={setB1} />
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
              ↕ Athletes Swap Boats
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
            <TimeInput label="Athlete A" value={a2} onChange={setA2} />
            <TimeInput label="Athlete B" value={b2} onChange={setB2} />
          </div>

          {/* ── Result ── */}
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
            {!result ? <EmptyState /> : <ResultBlock result={result} />}
          </div>
        </section>
      </div>
    </main>
  );
}

// ── TimeInput ─────────────────────────────────────────────────────────────────
// Letters are blocked silently at keystroke level — consistent with mobile
// where inputMode="decimal" already restricts to numbers.
// Only digits, colon, period, and control/navigation keys are accepted.
// Pasted content is filtered the same way.
// On blur, valid input is reformatted to "m:ss.hh".
// Shows an error if the entry is complete but invalid (e.g. seconds ≥ 60).

// Keys that are always allowed regardless of character
const NAV_KEYS = new Set([
  "Backspace", "Delete", "Tab", "Enter", "Escape",
  "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
  "Home", "End",
]);

function TimeInput({ label, value, onChange }) {
  const digits = value.replace(/[^0-9]/g, "");
  // Use permissive parser for error detection — strict parseTime rejects valid
  // incomplete inputs like "417" (4:17.00) which would cause false positives.
  const isError =
    value !== "" &&
    parseTimePermissive(value) === null &&
    (digits.length === 3 || digits.length >= 5);

  const isShorthand = !value.includes(":");

  const handleKeyDown = (e) => {
    // Always allow: navigation, editing, and keyboard shortcuts (copy/paste/etc.)
    if (e.ctrlKey || e.metaKey) return;
    if (NAV_KEYS.has(e.key)) return;
    // Allow digits — but block a 6th digit in shorthand mode (max 9 min = 5 digits)
    if (/^[0-9]$/.test(e.key)) {
      if (isShorthand && digits.length >= 5) {
        e.preventDefault();
        return;
      }
      return;
    }
    if (e.key === ":" || e.key === ".") return;
    // Block everything else — letters, symbols, etc.
    e.preventDefault();
  };

  const handleChange = (e) => {
    const raw = e.target.value;
    const newDigits = raw.replace(/[^0-9]/g, "");
    // Auto-format immediately when the 5th digit is typed in shorthand mode
    if (!raw.includes(":") && !raw.includes(".") && newDigits.length === 5) {
      onChange(reformatOnBlur(raw));
      return;
    }
    onChange(raw);
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text");
    // Strip anything that isn't a digit, colon, or period
    const filtered = pasted.replace(/[^0-9:.]/g, "");
    onChange(filtered);
  };

  return (
    <div>
      <label
        style={{
          display: "block",
          marginBottom: 8,
          fontSize: 13,
          fontWeight: 500,
          color: isError ? "#ef4444" : "#475569",
        }}
      >
        {label}
      </label>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onChange={handleChange}
        onBlur={(e) => onChange(reformatOnBlur(e.target.value))}
        placeholder="41755 → 4:17.55"
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "14px 16px",
          borderRadius: 14,
          border: isError ? "1.5px solid #ef4444" : "1.5px solid #cbd5e1",
          outline: "none",
          fontSize: 18,
          fontWeight: 500,
          background: isError ? "#fff5f5" : "white",
          color: "#0f172a",
          WebkitAppearance: "none",
        }}
      />
      {isError && (
        <div style={{ marginTop: 6, fontSize: 12, color: "#ef4444", fontWeight: 500 }}>
          Invalid — seconds must be 00–59
        </div>
      )}
    </div>
  );
}

// ── Supporting components ─────────────────────────────────────────────────────
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
        RowLab adds each athlete's piece times and compares totals — the method
        that correctly accounts for both boats speeding up or slowing down after
        the swap.
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
    piece1Margin,
    piece2Margin,
    boat1Change,
    boat2Change,
  } = result;

  return (
    <>
      <div
        style={{
          fontSize: 14,
          color: "rgba(255,255,255,0.55)",
          marginBottom: 8,
        }}
      >
        Seat Race Result
      </div>
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

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <MetricCard label="Athlete A Total" value={formatTime(totalA)} />
        <MetricCard label="Athlete B Total" value={formatTime(totalB)} />
      </div>

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
            label="Boat 1 — A then B"
            detail={
              boat1Change > 0
                ? `${boat1Change.toFixed(2)}s slower with B`
                : `${Math.abs(boat1Change).toFixed(2)}s faster with B`
            }
            highlight={boat1Change > 0 ? "slow" : "fast"}
          />
          <BreakdownRow
            label="Boat 2 — B then A"
            detail={
              boat2Change > 0
                ? `${boat2Change.toFixed(2)}s slower with A`
                : `${Math.abs(boat2Change).toFixed(2)}s faster with A`
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
