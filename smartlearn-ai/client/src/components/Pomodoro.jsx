import { useEffect, useRef, useState } from "react";

export default function Pomodoro() {
  const [focusMin, setFocusMin] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);

  const intervalRef = useRef(null);

  // ✅ when focusMin changes, reset secondsLeft (only if not running)
  useEffect(() => {
    if (!running) setSecondsLeft(Number(focusMin) * 60);
  }, [focusMin, running]);

  // ✅ main ticking effect
  useEffect(() => {
    if (!running) return;

    // safety: if somehow secondsLeft is 0, stop
    if (secondsLeft <= 0) {
      setRunning(false);
      return;
    }

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          setRunning(false);
          // 🔔 optional: play sound / toast here
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [running, secondsLeft]);

  const start = () => {
    // ✅ guard: duration 0 pe start mat hone do
    const initial = Number(focusMin) * 60;
    if (!secondsLeft || secondsLeft <= 0) setSecondsLeft(initial);
    if (initial <= 0) return;

    setRunning(true);
  };

  const reset = () => {
    setRunning(false);
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    setSecondsLeft(Number(focusMin) * 60);
  };

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="flex items-center gap-3">
      <span className="opacity-80">Focus</span>

      <input
        type="number"
        min={1}
        max={180}
        value={focusMin}
        onChange={(e) => setFocusMin(e.target.value)}
        className="w-16 rounded-xl px-3 py-2 bg-white/10 border border-white/15"
      />

      <div className="text-xl font-bold tabular-nums">{mm}:{ss}</div>

      <button
        onClick={start}
        disabled={running}
        className="px-5 py-2 rounded-xl bg-emerald-400 text-black font-semibold disabled:opacity-60"
      >
        Start
      </button>

      <button
        onClick={reset}
        className="px-5 py-2 rounded-xl bg-white/10 border border-white/15 font-semibold"
      >
        Reset
      </button>
    </div>
  );
}