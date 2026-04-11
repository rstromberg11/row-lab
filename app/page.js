"use client";
import { useMemo, useState, useCallback } from "react";
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

  // Feedback modal state
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackHover, setFeedbackHover] = useState(0);
  const [feedbackRole, setFeedbackRole] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackEmail, setFeedbackEmail] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState("idle"); // idle | submitting | success | error

  const openFeedback = () => setShowFeedback(true);
  const closeFeedback = () => {
    setShowFeedback(false);
    // Reset after close animation
    setTimeout(() => {
      setFeedbackRating(0);
      setFeedbackHover(0);
      setFeedbackRole("");
      setFeedbackMessage("");
      setFeedbackEmail("");
      setFeedbackStatus("idle");
    }, 300);
  };

  const handleFeedbackSubmit = useCallback(async () => {
    if (!feedbackRating || !feedbackMessage.trim()) return;
    setFeedbackStatus("submitting");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: feedbackRating,
          role: feedbackRole,
          message: feedbackMessage,
          email: feedbackEmail,
        }),
      });
      setFeedbackStatus(res.ok ? "success" : "error");
    } catch {
      setFeedbackStatus("error");
    }
  }, [feedbackRating, feedbackRole, feedbackMessage, feedbackEmail]);
  const pa1 = useMemo(() => parseTime(a1), [a1]);
  const pb1 = useMemo(() => parseTime(b1), [b1]);
  const pa2 = useMemo(() => parseTime(a2), [a2]);
  const pb2 = useMemo(() => parseTime(b2), [b2]);
  // Per-piece margins — available as soon as both times for that piece are entered.
  // piece1Margin > 0 → A's boat faster in piece 1; < 0 → B's boat faster.
  const piece1Margin = pa1 !== null && pb1 !== null ? pb1 - pa1 : null;
  const piece2Margin = pa2 !== null && pb2 !== null ? pb2 - pa2 : null;
  const result = useMemo(() => {
    if ([pa1, pb1, pa2, pb2].some((v) => v === null)) return null;
    return calcResult(pa1, pb1, pa2, pb2);
  }, [pa1, pb1, pa2, pb2]);
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
          <div style={{ marginBottom: 16 }}>
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
        {/* ── Feedback Modal ── */}
        {showFeedback && (
          <div
            onClick={(e) => { if (e.target === e.currentTarget) closeFeedback(); }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.65)",
              zIndex: 100,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
              backdropFilter: "blur(4px)",
            }}
          >
            <div
              style={{
                background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                borderRadius: 24,
                padding: 32,
                width: "100%",
                maxWidth: 480,
                boxShadow: "0 40px 80px rgba(0,0,0,0.5)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "white",
              }}
            >
              {feedbackStatus === "success" ? (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🙌</div>
                  <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>Thanks for the feedback!</div>
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 15, lineHeight: 1.6, margin: "0 0 24px" }}>
                    RowLab helps you build faster boats.
                  </p>
                  <button
                    onClick={closeFeedback}
                    style={{
                      padding: "12px 32px",
                      borderRadius: 12,
                      border: "none",
                      background: "rgba(255,255,255,0.12)",
                      color: "white",
                      fontSize: 15,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    Close
                  </button>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.2, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 6 }}>RowLab</div>
                      <div style={{ fontSize: 20, fontWeight: 700 }}>Share your feedback</div>
                    </div>
                    <button
                      onClick={closeFeedback}
                      style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "rgba(255,255,255,0.5)", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}
                    >
                      ×
                    </button>
                  </div>

                  {/* Star Rating */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.8, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", marginBottom: 10 }}>How useful is RowLab?</div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setFeedbackRating(star)}
                          onMouseEnter={() => setFeedbackHover(star)}
                          onMouseLeave={() => setFeedbackHover(0)}
                          style={{
                            background: "none",
                            border: "none",
                            fontSize: 32,
                            cursor: "pointer",
                            color: star <= (feedbackHover || feedbackRating) ? "#fbbf47" : "rgba(255,255,255,0.15)",
                            padding: "0 2px",
                            transition: "color 0.1s",
                            lineHeight: 1,
                          }}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Role selector */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.8, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", marginBottom: 10 }}>I am a...</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {["Athlete", "Coach", "Other"].map((r) => (
                        <button
                          key={r}
                          onClick={() => setFeedbackRole(feedbackRole === r ? "" : r)}
                          style={{
                            padding: "7px 16px",
                            borderRadius: 999,
                            border: "1.5px solid",
                            borderColor: feedbackRole === r ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.15)",
                            background: feedbackRole === r ? "rgba(255,255,255,0.1)" : "transparent",
                            color: feedbackRole === r ? "white" : "rgba(255,255,255,0.45)",
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: "pointer",
                            fontFamily: "inherit",
                            transition: "all 0.15s",
                          }}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Message */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.8, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", marginBottom: 10 }}>What would make RowLab better?</div>
                    <textarea
                      value={feedbackMessage}
                      onChange={(e) => setFeedbackMessage(e.target.value)}
                      placeholder="Anything — bugs, ideas, things that felt off..."
                      rows={3}
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "12px 14px",
                        borderRadius: 12,
                        border: "1.5px solid rgba(255,255,255,0.12)",
                        background: "rgba(255,255,255,0.06)",
                        color: "white",
                        fontSize: 14,
                        lineHeight: 1.6,
                        resize: "none",
                        fontFamily: "inherit",
                        outline: "none",
                      }}
                    />
                  </div>

                  {/* Email (optional) */}
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.8, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", marginBottom: 10 }}>Email <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional — for follow-up)</span></div>
                    <input
                      type="email"
                      value={feedbackEmail}
                      onChange={(e) => setFeedbackEmail(e.target.value)}
                      placeholder="you@example.com"
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "12px 14px",
                        borderRadius: 12,
                        border: "1.5px solid rgba(255,255,255,0.12)",
                        background: "rgba(255,255,255,0.06)",
                        color: "white",
                        fontSize: 14,
                        fontFamily: "inherit",
                        outline: "none",
                      }}
                    />
                  </div>

                  {/* Submit */}
                  {feedbackStatus === "error" && (
                    <div style={{ marginBottom: 12, fontSize: 13, color: "#f87171" }}>
                      Something went wrong — please try again.
                    </div>
                  )}
                  <button
                    onClick={handleFeedbackSubmit}
                    disabled={!feedbackRating || !feedbackMessage.trim() || feedbackStatus === "submitting"}
                    style={{
                      width: "100%",
                      padding: "14px",
                      borderRadius: 12,
                      border: "none",
                      background: !feedbackRating || !feedbackMessage.trim()
                        ? "rgba(255,255,255,0.08)"
                        : "white",
                      color: !feedbackRating || !feedbackMessage.trim()
                        ? "rgba(255,255,255,0.25)"
                        : "#0f172a",
                      fontSize: 15,
                      fontWeight: 700,
                      cursor: !feedbackRating || !feedbackMessage.trim() ? "default" : "pointer",
                      fontFamily: "inherit",
                      transition: "all 0.15s",
                    }}
                  >
                    {feedbackStatus === "submitting" ? "Sending..." : "Send Feedback"}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

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
          {/* Card top row: Reset button right-aligned */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: 16,
            }}
          >
            <button
              onClick={reset}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: "1.5px solid #e2e8f0",
                background: "transparent",
                color: "#64748b",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: 0.3,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#cbd5e1";
                e.currentTarget.style.color = "#0f172a";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#e2e8f0";
                e.currentTarget.style.color = "#64748b";
              }}
            >
              Reset
            </button>
          </div>
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
              hint={piece1Margin !== null && piece1Margin > 0 ? `Faster by ${piece1Margin.toFixed(2)}s` : null}
            />
            <TimeInput
              label="Athlete B"
              value={b1}
              onChange={setB1}
              hint={piece1Margin !== null && piece1Margin < 0 ? `Faster by ${Math.abs(piece1Margin).toFixed(2)}s` : null}
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
            <TimeInput
              label="Athlete A"
              value={a2}
              onChange={setA2}
              hint={piece2Margin !== null && piece2Margin > 0 ? `Faster by ${piece2Margin.toFixed(2)}s` : null}
            />
            <TimeInput
              label="Athlete B"
              value={b2}
              onChange={setB2}
              hint={piece2Margin !== null && piece2Margin < 0 ? `Faster by ${Math.abs(piece2Margin).toFixed(2)}s` : null}
            />
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

      {/* ── CTA Card ── */}
      <section
        style={{
          marginTop: 16,
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          borderRadius: 24,
          padding: "28px 24px",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 1.2,
            color: "rgba(255,255,255,0.35)",
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          What's Next
        </div>
        <p
          style={{
            margin: "0 0 20px",
            fontSize: 16,
            fontWeight: 400,
            lineHeight: 1.65,
            color: "rgba(255,255,255,0.78)",
          }}
        >
          RowLab is building a performance app for competitive rowers. Tell us what matters to your crew — and how to make RowLab better.
        </p>
        <button
          onClick={openFeedback}
          style={{
            width: "100%",
            padding: "14px 24px",
            borderRadius: 14,
            border: "1.5px solid rgba(255,255,255,0.2)",
            background: "rgba(255,255,255,0.08)",
            color: "white",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
            letterSpacing: 0.2,
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.14)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.08)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
          }}
        >
          Share Feedback & Ideas
        </button>
      </section>
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
function TimeInput({ label, value, onChange, hint }) {
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
      {isError ? (
        <div style={{ marginTop: 6, fontSize: 12, color: "#ef4444", fontWeight: 500 }}>
          Invalid — seconds must be 00–59
        </div>
      ) : hint ? (
        <div style={{ marginTop: 6, fontSize: 12, color: "#10b981", fontWeight: 600 }}>
          {hint}
        </div>
      ) : null}
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
