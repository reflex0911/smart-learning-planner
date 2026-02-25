import { useEffect, useMemo, useRef, useState } from "react";
import { auth, db } from "../firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

/** ✅ helper: seconds -> mm:ss */
const mmss = (totalSeconds = 0) => {
  const s = Math.max(0, Number(totalSeconds) || 0);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
};

const Dashboard = () => {
  const [studyHours, setStudyHours] = useState("");
  const [schedule, setSchedule] = useState([]);
  const [subjects, setSubjects] = useState([{ name: "", level: "Hard" }]);

  // AI
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  // wake/sleep
  const [wakeHour, setWakeHour] = useState("7");
  const [wakePeriod, setWakePeriod] = useState("AM");
  const [sleepHour, setSleepHour] = useState("11");
  const [sleepPeriod, setSleepPeriod] = useState("PM");

  // college
  const [goesCollege, setGoesCollege] = useState(false);
  const [collegeStartHour, setCollegeStartHour] = useState("9");
  const [collegeStartPeriod, setCollegeStartPeriod] = useState("AM");
  const [collegeEndHour, setCollegeEndHour] = useState("4");
  const [collegeEndPeriod, setCollegeEndPeriod] = useState("PM");

  // firebase user + loading
  const [user, setUser] = useState(null);
  const [bootLoading, setBootLoading] = useState(true);

  // streak
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [lastStreakDate, setLastStreakDate] = useState("");

  // fade
  const [mounted, setMounted] = useState(false);

  // focus timer
  const [timerMins, setTimerMins] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);

  // safety refs
  const hydratedRef = useRef(false);

  // 🔊 sound (mp3) optional
  const audioRef = useRef(null);

  // 🔔 better mac-like sound (AudioContext)
  const audioCtxRef = useRef(null);
  const unlockAudio = async () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtxRef.current.state === "suspended") await audioCtxRef.current.resume();
    } catch {}
  };
  const playMacSound = () => {
    try {
      const ctx = audioCtxRef.current;
      if (!ctx) return;

      const playTone = (freq, delay = 0, duration = 0.35) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = "sine";
        osc.frequency.value = freq;

        const now = ctx.currentTime + delay;
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.12, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        osc.start(now);
        osc.stop(now + duration + 0.05);
      };

      playTone(880, 0);
      playTone(660, 0.16);
    } catch {}
  };

  useEffect(() => {
    return () => {
      try {
        audioCtxRef.current?.close?.();
      } catch {}
    };
  }, []);

  // ---------- theme detect ----------
  const [isPearl, setIsPearl] = useState(false);
  useEffect(() => {
    const readTheme = () =>
      typeof document !== "undefined" &&
      document.documentElement.getAttribute("data-theme") === "pearl";

    setIsPearl(readTheme());

    if (typeof document === "undefined") return;

    const obs = new MutationObserver(() => setIsPearl(readTheme()));
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => obs.disconnect();
  }, []);

  // ---------- UI tokens ----------
  const topTitle = isPearl ? "text-slate-900" : "text-white";
  const topMuted = isPearl ? "text-slate-700" : "text-white/80";
  const topName = isPearl ? "text-slate-900" : "text-white";

  const pillWrap = isPearl
    ? "glass-white soft-shadow rounded-2xl"
    : "glass soft-shadow rounded-2xl";

  const pillTitle = isPearl ? "text-slate-700" : "text-white/80";
  const pillValue = isPearl ? "text-slate-900" : "text-white";

  // ---------- helpers ----------
  const convertTo24 = (hour, period) => {
    let h = parseInt(hour);
    if (period === "PM" && h !== 12) h += 12;
    if (period === "AM" && h === 12) h = 0;
    return h;
  };

  const convertTo12 = (time) => {
    const totalMinutes = Math.round(time * 60);
    const hours24 = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const period = hours24 >= 12 ? "PM" : "AM";
    const hours12 = hours24 % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  const addSubject = () => setSubjects((p) => [...p, { name: "", level: "Hard" }]);

  const updateSubject = (index, field, value) => {
    setSubjects((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const todayKey = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const yesterdayKey = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  // ---------- emoji confetti ----------
  const emojiConfetti = (count = 26) => {
    if (typeof document === "undefined") return;

    for (let i = 0; i < count; i++) {
      const el = document.createElement("span");
      el.textContent = ["✨", "🎉", "🎊", "💫"][Math.floor(Math.random() * 4)];
      el.style.position = "fixed";
      el.style.left = "50%";
      el.style.top = "18%";
      el.style.transform = "translate(-50%, -50%)";
      el.style.zIndex = "99999";
      el.style.fontSize = `${12 + Math.random() * 18}px`;
      el.style.opacity = "1";
      el.style.pointerEvents = "none";
      document.body.appendChild(el);

      const angle = Math.random() * Math.PI * 2;
      const distance = 140 + Math.random() * 280;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance + 180;

      el.animate(
        [
          { transform: "translate(-50%, -50%) translate(0px, 0px) rotate(0deg)", opacity: 1 },
          {
            transform: `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${Math.random() * 720}deg)`,
            opacity: 0,
          },
        ],
        { duration: 1100 + Math.random() * 600, easing: "cubic-bezier(.2,.9,.2,1)", fill: "forwards" }
      );

      setTimeout(() => el.remove(), 1800);
    }
  };

  // ---------- auth + load ----------
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);

      const uid = u?.uid || "guest";
      const LS_SCHEDULE = `schedule_${uid}`;
      const LS_SUBJECTS = `subjects_${uid}`;
      const LS_SETTINGS = `settings_${uid}`;
      const LS_STATS = `stats_${uid}`;

      const loadLocal = () => {
        const savedSchedule = localStorage.getItem(LS_SCHEDULE);
        const savedSubjects = localStorage.getItem(LS_SUBJECTS);
        const savedSettings = localStorage.getItem(LS_SETTINGS);
        const savedStats = localStorage.getItem(LS_STATS);

        if (savedSchedule) setSchedule(JSON.parse(savedSchedule));
        if (savedSubjects) setSubjects(JSON.parse(savedSubjects));

        if (savedSettings) {
          const s = JSON.parse(savedSettings);
          if (s.studyHours !== undefined) setStudyHours(s.studyHours);
          if (s.wakeHour) setWakeHour(s.wakeHour);
          if (s.wakePeriod) setWakePeriod(s.wakePeriod);
          if (s.sleepHour) setSleepHour(s.sleepHour);
          if (s.sleepPeriod) setSleepPeriod(s.sleepPeriod);
          if (typeof s.goesCollege === "boolean") setGoesCollege(s.goesCollege);
          if (s.collegeStartHour) setCollegeStartHour(s.collegeStartHour);
          if (s.collegeStartPeriod) setCollegeStartPeriod(s.collegeStartPeriod);
          if (s.collegeEndHour) setCollegeEndHour(s.collegeEndHour);
          if (s.collegeEndPeriod) setCollegeEndPeriod(s.collegeEndPeriod);
        }

        if (savedStats) {
          const st = JSON.parse(savedStats);
          if (typeof st.streak === "number") setStreak(st.streak);
          if (typeof st.bestStreak === "number") setBestStreak(st.bestStreak);
          if (typeof st.lastStreakDate === "string") setLastStreakDate(st.lastStreakDate);
        }
      };

      if (!u) {
        loadLocal();
        hydratedRef.current = true;
        setBootLoading(false);
        setMounted(true);
        return;
      }

      try {
        const docRef = doc(db, "users", u.uid);
        const snap = await getDoc(docRef);

        if (snap.exists()) {
          const data = snap.data();

          if (Array.isArray(data.schedule)) setSchedule(data.schedule);
          if (Array.isArray(data.subjects)) setSubjects(data.subjects);

          if (data.settings) {
            const s = data.settings;
            if (s.studyHours !== undefined) setStudyHours(String(s.studyHours ?? ""));
            if (s.wakeHour) setWakeHour(s.wakeHour);
            if (s.wakePeriod) setWakePeriod(s.wakePeriod);
            if (s.sleepHour) setSleepHour(s.sleepHour);
            if (s.sleepPeriod) setSleepPeriod(s.sleepPeriod);
            if (typeof s.goesCollege === "boolean") setGoesCollege(s.goesCollege);
            if (s.collegeStartHour) setCollegeStartHour(s.collegeStartHour);
            if (s.collegeStartPeriod) setCollegeStartPeriod(s.collegeStartPeriod);
            if (s.collegeEndHour) setCollegeEndHour(s.collegeEndHour);
            if (s.collegeEndPeriod) setCollegeEndPeriod(s.collegeEndPeriod);
          }

          if (data.stats) {
            const st = data.stats;
            if (typeof st.streak === "number") setStreak(st.streak);
            if (typeof st.bestStreak === "number") setBestStreak(st.bestStreak);
            if (typeof st.lastStreakDate === "string") setLastStreakDate(st.lastStreakDate);
          }
        } else {
          loadLocal();
        }
      } catch {
        loadLocal();
      } finally {
        hydratedRef.current = true;
        setBootLoading(false);
        setMounted(true);
      }
    });

    return () => unsub();
  }, []);

  // ---------- local saves ----------
  useEffect(() => {
    const uid = user?.uid || "guest";
    localStorage.setItem(`schedule_${uid}`, JSON.stringify(schedule));
  }, [schedule, user]);

  useEffect(() => {
    const uid = user?.uid || "guest";
    localStorage.setItem(`subjects_${uid}`, JSON.stringify(subjects));
  }, [subjects, user]);

  useEffect(() => {
    const uid = user?.uid || "guest";
    const settings = {
      studyHours,
      wakeHour,
      wakePeriod,
      sleepHour,
      sleepPeriod,
      goesCollege,
      collegeStartHour,
      collegeStartPeriod,
      collegeEndHour,
      collegeEndPeriod,
    };
    localStorage.setItem(`settings_${uid}`, JSON.stringify(settings));
  }, [
    studyHours,
    wakeHour,
    wakePeriod,
    sleepHour,
    sleepPeriod,
    goesCollege,
    collegeStartHour,
    collegeStartPeriod,
    collegeEndHour,
    collegeEndPeriod,
    user,
  ]);

  useEffect(() => {
    const uid = user?.uid || "guest";
    localStorage.setItem(`stats_${uid}`, JSON.stringify({ streak, bestStreak, lastStreakDate }));
  }, [streak, bestStreak, lastStreakDate, user]);

  // ---------- firestore autosave (debounced) ----------
  useEffect(() => {
    if (!user) return;
    if (!hydratedRef.current) return;

    const t = setTimeout(async () => {
      try {
        await setDoc(
          doc(db, "users", user.uid),
          {
            schedule,
            subjects,
            settings: {
              studyHours,
              wakeHour,
              wakePeriod,
              sleepHour,
              sleepPeriod,
              goesCollege,
              collegeStartHour,
              collegeStartPeriod,
              collegeEndHour,
              collegeEndPeriod,
            },
            stats: { streak, bestStreak, lastStreakDate },
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch {}
    }, 600);

    return () => clearTimeout(t);
  }, [
    schedule,
    subjects,
    studyHours,
    wakeHour,
    wakePeriod,
    sleepHour,
    sleepPeriod,
    goesCollege,
    collegeStartHour,
    collegeStartPeriod,
    collegeEndHour,
    collegeEndPeriod,
    streak,
    bestStreak,
    lastStreakDate,
    user,
  ]);

  // ✅ Progress
  const { total, done, progress } = useMemo(() => {
    const t = schedule.filter((i) => i.subject !== "Break ☕").length;
    const d = schedule.filter((i) => i.completed && i.subject !== "Break ☕").length;
    return { total: t, done: d, progress: t ? Math.round((d / t) * 100) : 0 };
  }, [schedule]);

  // ✅ toggleDone
  const toggleDone = (index) => {
    setSchedule((prev) => {
      const updated = [...prev];
      if (!updated[index]) return prev;

      const nextCompleted = !updated[index].completed;
      updated[index] = { ...updated[index], completed: nextCompleted };

      // auto-toggle break with study block
      if (updated[index + 1]?.subject === "Break ☕") {
        updated[index + 1] = { ...updated[index + 1], completed: nextCompleted };
      }
      return updated;
    });
  };

  // ✅ reset setup
  const resetSetup = () => {
    setStudyHours("");
    setWakeHour("7");
    setWakePeriod("AM");
    setSleepHour("11");
    setSleepPeriod("PM");

    setGoesCollege(false);
    setCollegeStartHour("9");
    setCollegeStartPeriod("AM");
    setCollegeEndHour("4");
    setCollegeEndPeriod("PM");

    setSubjects([{ name: "", level: "Hard" }]);
    setSchedule([]);
  };

  // ✅ schedule generator (AI + fallback)
  const generateSchedule = async () => {
    if (!studyHours) return;

    const cleanedSubjects = subjects
      .filter((s) => s?.name?.trim())
      .map((s) => ({ name: s.name.trim(), level: s.level }));

    if (!cleanedSubjects.length) return;

    const wakeTime = `${wakeHour} ${wakePeriod}`;
    const sleepTime = `${sleepHour} ${sleepPeriod}`;

    try {
      const API = import.meta.env.VITE_API_URL || "http://localhost:5001";
      const res = await fetch(`${API}/ai/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjects: cleanedSubjects,
          studyHours: Number(studyHours),
          wakeTime,
          sleepTime,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "AI schedule error");

      const list = (data.schedule || []).map((x) => ({
        subject: x.subject,
        time: x.time,
        completed: false,
      }));

      setSchedule(list);
      return;
    } catch (e) {
      console.log("AI schedule failed, using fallback:", e);
    }

    // fallback
    let remaining = parseFloat(studyHours);
    if (!remaining) return;

    const hard = cleanedSubjects.filter((s) => s.level === "Hard");
    const medium = cleanedSubjects.filter((s) => s.level === "Medium");
    const easy = cleanedSubjects.filter((s) => s.level === "Easy");
    const ordered = [...hard, ...medium, ...easy];
    if (!ordered.length) return;

    const wake24 = convertTo24(wakeHour, wakePeriod);
    const sleep24 = convertTo24(sleepHour, sleepPeriod);
    const collegeS = convertTo24(collegeStartHour, collegeStartPeriod);
    const collegeE = convertTo24(collegeEndHour, collegeEndPeriod);

    let start = wake24 + 0.5;
    let list2 = [];
    let i = 0;

    while (remaining > 0 && start < sleep24) {
      const sub = ordered[i % ordered.length];

      let block = 1;
      if (sub.level === "Hard") block = 2;
      if (sub.level === "Medium") block = 1.5;
      if (remaining < block) block = remaining;

      let end = start + block;

      if (goesCollege && start < collegeE && end > collegeS) {
        start = collegeE + 1;
        continue;
      }

      list2.push({
        subject: sub.name,
        time: `${convertTo12(start)} - ${convertTo12(end)}`,
        completed: false,
      });

      start = end;
      remaining -= block;
      i++;

      if (remaining > 0) {
        let bEnd = start + 0.25;
        list2.push({
          subject: "Break ☕",
          time: `${convertTo12(start)} - ${convertTo12(bEnd)}`,
          completed: false,
        });
        start = bEnd;
      }
    }

    setSchedule(list2);
  };

  // ✅ streak update when completed
  useEffect(() => {
    if (!hydratedRef.current) return;
    if (total === 0) return;
    if (progress !== 100) return;

    const today = todayKey();
    if (lastStreakDate === today) return;

    const yest = yesterdayKey();
    const newStreak = lastStreakDate === yest ? streak + 1 : 1;
    const newBest = Math.max(bestStreak, newStreak);

    setStreak(newStreak);
    setBestStreak(newBest);
    setLastStreakDate(today);

    emojiConfetti(34);
  }, [progress, total, lastStreakDate, streak, bestStreak]);

  // ✅ TIMER: reset only when mins changes AND not running
  useEffect(() => {
    const safe = Math.max(1, Math.min(180, Number(timerMins) || 25));
    setSecondsLeft(safe * 60);
    setTimerRunning(false);
  }, [timerMins]);

  // ✅ TIMER: countdown
  useEffect(() => {
    if (!timerRunning) return;

    const id = setInterval(() => {
      setSecondsLeft((s) => {
        const curr = Number.isFinite(s) ? s : 0;
        if (curr <= 0) return 0;

        const next = curr - 1;

        if (next === 0) {
          // stop + sound once
          setTimerRunning(false);
          playMacSound();
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => {});
          }
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [timerRunning]);

  // ✅ AI suggest (debounced + abort)
  const aiAbortRef = useRef(null);
  useEffect(() => {
    if (!hydratedRef.current) return;

    const cleanedSubjects = subjects
      .filter((s) => s?.name?.trim())
      .map((s) => ({ name: s.name.trim(), level: s.level }));

    // if nothing meaningful, don’t spam
    if (!cleanedSubjects.length && !studyHours) {
      setAiText("");
      setAiError("");
      setAiLoading(false);
      return;
    }

    const t = setTimeout(async () => {
      try {
        setAiError("");
        setAiLoading(true);

        // abort previous
        if (aiAbortRef.current) aiAbortRef.current.abort();
        const controller = new AbortController();
        aiAbortRef.current = controller;

        const API = import.meta.env.VITE_API_URL || "http://localhost:5001";
        const res = await fetch(`${API}/ai/suggest`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            subjects: cleanedSubjects,
            studyHours,
            progress,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "AI error");

        setAiText((data.text || "").toString());
      } catch (e) {
        // ignore abort
        if (e?.name === "AbortError") return;

        setAiError(e?.message || "AI failed");
        setAiText("");
      } finally {
        setAiLoading(false);
      }
    }, 450);

    return () => clearTimeout(t);
  }, [subjects, studyHours, progress]);

  // cards styles
  const card =
    "rounded-3xl border border-black/10 bg-white/80 backdrop-blur-2xl shadow-[0_18px_70px_rgba(0,0,0,0.18)] transition-all duration-300 hover:shadow-[0_26px_90px_rgba(0,0,0,0.24)]";
  const soft = "border border-black/10 bg-slate-50";

  const input =
    "w-full rounded-2xl px-4 py-3 outline-none border border-black/10 bg-white text-slate-900 placeholder:text-slate-400 shadow-[0_10px_30px_rgba(0,0,0,0.08)] focus:ring-2 focus:ring-emerald-400/40";
  const select =
    "rounded-2xl px-3 py-3 outline-none border border-black/10 bg-white text-slate-900 shadow-[0_10px_30px_rgba(0,0,0,0.08)] focus:ring-2 focus:ring-emerald-400/40";

  const insideHeading = "text-slate-900";
  const insideMuted = "text-slate-600";

  const vibeLine = useMemo(() => {
    if (total === 0) return "Aaj ka plan set karte hain — bas 2 minutes 😌";
    if (progress === 0) return "Start small. First block done = momentum 🔥";
    if (progress < 50) return "Nice. Bas keep going — flow ban raha hai ✨";
    if (progress < 100) return "Almost there. Aaj ka streak bachaa lo 😤";
    return "Perfect. Aaj ka day conquered ✅";
  }, [progress, total]);

  if (bootLoading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className={`${card} p-6`}>
          <p className={insideMuted}>Loading your planner...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative mx-auto max-w-6xl px-4 py-8">
      {/* subtle premium background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl" />
      </div>

      {/* optional audio */}
      <audio ref={audioRef} src="/mac-ding.mp3" preload="auto" />

      <div
        className={`transition-all duration-700 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        }`}
      >
        {/* Header */}
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className={`text-2xl md:text-3xl font-extrabold tracking-tight ${topTitle}`}>
              Smart Planner <span className="inline-block">🧠</span>
            </h1>

            <p className={`mt-1 ${topMuted}`}>
              {greeting}
              {user?.email ? (
                <>
                  ,{" "}
                  <span className={`font-semibold ${topName}`}>
                    {user.displayName || user.email}
                  </span>
                </>
              ) : (
                ""
              )}
              . {vibeLine}
            </p>

            {/* Premium pills */}
            <div className="mt-3 flex flex-wrap gap-2">
              <div className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 ${pillWrap}`}>
                <span className={`text-sm ${pillTitle}`}>Today’s Progress ✨</span>
                <span className={`text-sm font-semibold ${pillValue}`}>{progress}%</span>
              </div>

              <div className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 ${pillWrap}`}>
                <span className={`text-sm ${pillTitle}`}>
                  Streak{" "}
                  <span className={streak > 0 ? "inline-block animate-pulse" : ""}>🔥</span>
                </span>
                <span className={`text-sm font-semibold ${pillValue}`}>{streak} day</span>
              </div>

              <div className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 ${pillWrap}`}>
                <span className={`text-sm ${pillTitle}`}>Best 🏆</span>
                <span className={`text-sm font-semibold ${pillValue}`}>{bestStreak}</span>
              </div>

              <div className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 ${pillWrap}`}>
                <span className={`text-sm ${pillTitle}`}>AI</span>
                <span className={`text-sm font-semibold ${pillValue}`}>
                  {aiLoading ? "Thinking..." : aiError ? "AI is ready✅" : (aiText || "Ready")}
                </span>
              </div>
            </div>
          </div>

          {/* ✅ Focus timer (TOP RIGHT) */}
          <div className="sm:absolute sm:right-0 sm:top-0 mt-3 sm:mt-0">
            <div className={`inline-flex items-center gap-2 rounded-2xl px-3 py-2 ${pillWrap}`}>
              <span className={`text-sm ${pillTitle}`}>Focus</span>

              {/* ✅ Minutes input BACK */}
              <input
                type="number"
                min={1}
                max={180}
                value={timerMins}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setTimerMins(Number.isFinite(v) ? v : 25);
                }}
                className={`w-16 rounded-xl px-2 py-1 text-sm border ${
                  isPearl
                    ? "border-black/10 bg-white text-slate-900"
                    : "border-white/20 bg-white/10 text-white"
                } outline-none`}
                title="Minutes"
              />

              {/* ✅ Correct countdown display */}
              <span className={`text-sm font-extrabold tabular-nums ${pillValue}`}>
                {mmss(secondsLeft)}
              </span>

              <button
                type="button"
                onClick={async () => {
                  await unlockAudio();
                  setTimerRunning((v) => !v);
                }}
                className={`rounded-xl px-3 py-1.5 text-sm font-semibold border transition active:scale-[0.99] ${
                  timerRunning
                    ? isPearl
                      ? "bg-slate-900 text-white border-black/10"
                      : "bg-white text-black border-white/20"
                    : "bg-gradient-to-r from-emerald-400 to-teal-400 text-black border-black/0 hover:brightness-105"
                }`}
              >
                {timerRunning ? "Pause" : "Start"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setTimerRunning(false);
                  const safe = Math.max(1, Math.min(180, Number(timerMins) || 25));
                  setSecondsLeft(safe * 60);
                }}
                className={`rounded-xl px-3 py-1.5 text-sm font-semibold border transition active:scale-[0.99] ${
                  isPearl
                    ? "bg-white text-slate-900 border-black/10 hover:bg-slate-50"
                    : "bg-white/10 text-white border-white/20 hover:bg-white/15"
                }`}
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Main grid */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left */}
          <section className={`lg:col-span-2 p-5 md:p-6 ${card}`}>
            <h2 className={`text-lg font-semibold ${insideHeading}`}>Setup</h2>
            <p className={`text-sm mt-1 ${insideMuted}`}>
              Set your timings, add subjects, and choose total study hours.
            </p>

            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className={`text-sm mb-1 ${insideMuted}`}>Wake</p>
                  <div className="flex gap-2">
                    <select value={wakeHour} onChange={(e) => setWakeHour(e.target.value)} className={select}>
                      {[...Array(12)].map((_, i) => (
                        <option key={i + 1}>{i + 1}</option>
                      ))}
                    </select>
                    <select value={wakePeriod} onChange={(e) => setWakePeriod(e.target.value)} className={select}>
                      <option>AM</option>
                      <option>PM</option>
                    </select>
                  </div>
                </div>

                <div>
                  <p className={`text-sm mb-1 ${insideMuted}`}>Sleep</p>
                  <div className="flex gap-2">
                    <select value={sleepHour} onChange={(e) => setSleepHour(e.target.value)} className={select}>
                      {[...Array(12)].map((_, i) => (
                        <option key={i + 1}>{i + 1}</option>
                      ))}
                    </select>
                    <select value={sleepPeriod} onChange={(e) => setSleepPeriod(e.target.value)} className={select}>
                      <option>AM</option>
                      <option>PM</option>
                    </select>
                  </div>
                </div>
              </div>

              <label className={`flex items-center justify-between rounded-2xl px-4 py-3 ${soft}`}>
                <div>
                  <p className={`font-medium ${insideHeading}`}>College?</p>
                  <p className={`text-sm ${insideMuted}`}>Exclude college hours from study blocks.</p>
                </div>
                <input
                  type="checkbox"
                  checked={goesCollege}
                  onChange={() => setGoesCollege(!goesCollege)}
                  className="h-5 w-5 accent-emerald-500"
                />
              </label>

              {goesCollege && (
                <div className={`rounded-2xl p-4 space-y-3 ${soft}`}>
                  <p className={`text-sm ${insideMuted}`}>College timing</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <p className={`text-xs mb-1 ${insideMuted}`}>Start</p>
                      <div className="flex gap-2">
                        <select value={collegeStartHour} onChange={(e) => setCollegeStartHour(e.target.value)} className={select}>
                          {[...Array(12)].map((_, i) => (
                            <option key={i + 1}>{i + 1}</option>
                          ))}
                        </select>
                        <select value={collegeStartPeriod} onChange={(e) => setCollegeStartPeriod(e.target.value)} className={select}>
                          <option>AM</option>
                          <option>PM</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <p className={`text-xs mb-1 ${insideMuted}`}>End</p>
                      <div className="flex gap-2">
                        <select value={collegeEndHour} onChange={(e) => setCollegeEndHour(e.target.value)} className={select}>
                          {[...Array(12)].map((_, i) => (
                            <option key={i + 1}>{i + 1}</option>
                          ))}
                        </select>
                        <select value={collegeEndPeriod} onChange={(e) => setCollegeEndPeriod(e.target.value)} className={select}>
                          <option>AM</option>
                          <option>PM</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <p className={`text-sm mb-1 ${insideMuted}`}>Total study hours</p>
                <input
                  type="number"
                  placeholder="e.g. 5"
                  value={studyHours}
                  onChange={(e) => setStudyHours(e.target.value)}
                  className={input}
                />
                <p className={`text-xs mt-1 ${insideMuted}`}>Tip: Hard=2h, Medium=1.5h, Easy=1h + short breaks.</p>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <p className={`text-sm ${insideMuted}`}>Subjects</p>

                  <button
                    type="button"
                    onClick={addSubject}
                    className="text-sm rounded-2xl px-3 py-2 border border-black/10 bg-white text-slate-900 shadow-[0_10px_30px_rgba(0,0,0,0.08)] hover:bg-slate-50 active:scale-[0.99] transition"
                  >
                    + Add
                  </button>
                </div>

                <div className="mt-3 space-y-2">
                  {subjects.map((s, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        placeholder="Subject name"
                        value={s.name}
                        onChange={(e) => updateSubject(i, "name", e.target.value)}
                        className={input}
                      />
                      <select
                        value={s.level}
                        onChange={(e) => updateSubject(i, "level", e.target.value)}
                        className={`${select} w-28`}
                      >
                        <option>Hard</option>
                        <option>Medium</option>
                        <option>Easy</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 space-y-3">
                <button
                  onClick={generateSchedule}
                  className="w-full rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 px-5 py-3 font-semibold text-black soft-shadow hover-glow hover:brightness-105 active:scale-[0.99] transition"
                >
                  Generate Schedule
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSchedule([])}
                    className="rounded-2xl px-5 py-3 font-semibold border border-black/10 bg-white text-slate-900 shadow-[0_10px_30px_rgba(0,0,0,0.08)] hover:bg-slate-50 active:scale-[0.99] transition"
                  >
                    Clear Plan
                  </button>

                  <button
                    type="button"
                    onClick={resetSetup}
                    className="w-full rounded-2xl px-5 py-3 font-semibold border border-red-200 bg-red-50/80 backdrop-blur soft-shadow hover:bg-red-100 active:scale-[0.99] transition text-red-700"
                  >
                    Reset Setup
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Right */}
          <section className={`lg:col-span-3 p-5 md:p-6 ${card}`}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className={`text-lg font-semibold ${insideHeading}`}>Today’s Plan</h2>
                <p className={`text-sm mt-1 ${insideMuted}`}>
                  {total ? `${done} of ${total} study blocks completed` : "Create a schedule to see your plan here."}
                </p>
              </div>

              <div className="w-44">
                <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={`h-2 rounded-full ${
                      progress === 100
                        ? "bg-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.55)]"
                        : "bg-emerald-500"
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className={`text-xs mt-1 text-right ${insideMuted}`}>{progress}%</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {schedule.length === 0 ? (
                <div className={`rounded-2xl p-6 ${soft}`}>
                  <span className={insideHeading}>Add subjects and total hours</span>{" "}
                  <span className={insideMuted}>— then tap</span>{" "}
                  <span className={insideHeading}>Generate Schedule</span>.
                </div>
              ) : (
                schedule.map((item, i) => (
                  <div
                    key={i}
                    className={`rounded-2xl p-4 flex items-start justify-between gap-4 border border-black/10 transition hover:shadow-[0_18px_55px_rgba(0,0,0,0.14)] ${
                      item.subject === "Break ☕" ? "bg-slate-50" : "bg-white"
                    }`}
                  >
                    <div className="min-w-0">
                      <h3
                        className={`font-semibold truncate ${
                          item.completed ? "line-through text-emerald-600" : insideHeading
                        }`}
                      >
                        {item.subject}
                      </h3>
                      <p className={`text-sm mt-1 ${insideMuted}`}>{item.time}</p>
                    </div>

                    {item.subject !== "Break ☕" && (
                      <button
                        onClick={() => toggleDone(i)}
                        className={`shrink-0 rounded-2xl px-3 py-2 text-sm font-semibold border transition active:scale-[0.99] ${
                          item.completed
                            ? "bg-emerald-500 text-black border-emerald-400/30 hover:bg-emerald-400 shadow-[0_12px_40px_rgba(16,185,129,0.25)]"
                            : "bg-white text-slate-900 border-black/10 hover:bg-slate-50 shadow-[0_10px_30px_rgba(0,0,0,0.08)]"
                        }`}
                      >
                        {item.completed ? "Done ✓" : "Mark done"}
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default Dashboard;