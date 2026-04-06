"use client";

import { useState } from "react";

function parseTime(input) {
  if (!input) return 0;
  const parts = input.split(":").map(Number);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return Number(input);
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = (seconds % 60).toFixed(2).padStart(5, "0");
  return `${m}:${s}`;
}

export default function Page() {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [method, setMethod] = useState("subtract");

  const timeA = parseTime(a);
  const timeB = parseTime(b);

  let result = null;

  if (timeA && timeB) {
    let diff;

    if (method === "add") {
      diff = timeA + timeB;
    } else {
      diff = Math.abs(timeA - timeB);
    }

    const winner =
      method === "subtract"
        ? timeA < timeB
          ? "Boat A"
          : "Boat B"
        : "Combined result";

    result = { winner, diff };
  }

  return (
    <div style={{ padding: 40, fontFamily: "sans-serif", maxWidth: 500 }}>
      <h1>RowLab</h1>
      <p>Seat Race Calculator</p>

      <input
        placeholder="Boat A time (e.g. 4:25.23)"
        value={a}
        onChange={(e) => setA(e.target.value)}
        style={{ display: "block", marginBottom: 10, width: "100%" }}
      />

      <input
        placeholder="Boat B time (e.g. 4:29.44)"
        value={b}
        onChange={(e) => setB(e.target.value)}
        style={{ display: "block", marginBottom: 10, width: "100%" }}
      />

      <div style={{ marginBottom: 20 }}>
        <button onClick={() => setMethod("subtract")}>
          Subtraction Method
        </button>{" "}
        <button onClick={() => setMethod("add")}>
          UW (Add Times)
        </button>
      </div>

      {result && (
        <div>
          <h2>{result.winner}</h2>
          <p>Difference: {formatTime(result.diff)}</p>
        </div>
      )}
    </div>
  );
}
