import express from "express";
import cors from "cors";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log("Server running", PORT));

// ✅ CORS
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://YOUR-VERCEL-NAME.vercel.app",
    ],
    credentials: true,
  })
);
app.use(express.json());

// ✅ health route
app.get("/ai", (req, res) => {
  res.status(200).send("AI server working 🚀");
});

// ✅ OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


// ===============================
// 🔥 AI SHORT SUGGESTION
// ===============================
app.post("/ai/suggest", async (req, res) => {
  try {
    const { subjects, studyHours, progress } = req.body;

    const prompt = `
You are a smart study productivity AI.

Subjects: ${JSON.stringify(subjects)}
Study hours today: ${studyHours}
Progress: ${progress}%

Give one short motivational + smart suggestion for next study step.
Max 1 line.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    res.json({ text: response.choices?.[0]?.message?.content || "" });
  } catch (e) {
    console.log("AI suggest error:", e);
    res.status(500).json({ error: "AI error" });
  }
});


// ===============================
// 🔥 FULL AI SCHEDULE GENERATOR
// ===============================
app.post("/ai/schedule", async (req, res) => {
  try {
    const { subjects, studyHours, wakeTime, sleepTime } = req.body;

    const prompt = `
You are an expert study planner AI.

Create a realistic daily study schedule in JSON.

Subjects:
${JSON.stringify(subjects)}

Total study hours: ${studyHours}
Wake time: ${wakeTime}
Sleep time: ${sleepTime}

Return ONLY valid JSON array like:
[
  { "subject":"Math", "time":"7:00 AM - 9:00 AM" },
  { "subject":"Break", "time":"9:00 AM - 9:30 AM" }
]
No markdown. No extra text.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6,
    });

    const text = response.choices?.[0]?.message?.content || "";

    // 🧠 clean JSON if AI sends ```json
    const cleaned = text
      .trim()
      .replace(/^```json/i, "")
      .replace(/^```/i, "")
      .replace(/```$/i, "")
      .trim();

    let json;
    try {
      json = JSON.parse(cleaned);
    } catch (err) {
      console.log("JSON parse failed. Raw AI output:", text);
      return res.status(500).json({
        error: "AI returned non-JSON",
        raw: text,
      });
    }

    res.json({ schedule: json });

  } catch (e) {
    console.log("AI schedule error:", e);
    res.status(500).json({ error: "AI schedule error" });
  }
});


// ===============================
// 🚀 START SERVER
// ===============================
app.listen(5001, () => console.log("AI server running 🚀 on 5001"));