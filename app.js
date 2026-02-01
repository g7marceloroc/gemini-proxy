const express = require("express");

const app = express();
const port = process.env.PORT || 3001;

/* ========= MIDDLEWARE ========= */
app.use(express.json());

/* ========= CHAT COMPLETIONS ========= */
app.post("/v1/chat/completions", async (req, res) => {
  try {
    const messages = req.body.messages || [];
    const prompt = messages.map(m => m.content).join("\n");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL}:generateContent?key=${process.env.GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sem resposta do Gemini";

    return res.json({
      id: "chatcmpl-gemini-proxy",
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: "gpt-3.5-turbo",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: text
          },
          finish_reason: "stop"
        }
      ]
    });
  } catch (e) {
    return res.status(500).json({ error: "erro interno" });
  }
});

/* ========= FALLBACK ABSOLUTO ========= */
/* QUALQUER ROTA RESPONDE */
app.all("*", (req, res) => {
  res.status(200).send("OK");
});

/* ========= START ========= */
app.listen(port, () => {
  console.log("Server running on port", port);
});
