const express = require("express");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();
app.use(express.json());

/* ROOT */
app.get("/", (req, res) => {
  res.status(200).send("OK");
});

/* OPENAI COMPATÍVEL */
app.post("/v1/chat/completions", async (req, res) => {
  try {
    const messages = req.body.messages || [];
    const userMessage = messages.map(m => m.content).join("\n");

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL}:generateContent?key=${process.env.GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            { parts: [{ text: userMessage }] }
          ]
        })
      }
    );

    const data = await geminiResponse.json();
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
  } catch {
    return res.status(500).json({ error: "Erro no Gemini Proxy" });
  }
});

/* FALLBACK GLOBAL */
app.all("*", (req, res) => {
  res.status(200).send("OK");
});

/* SERVER */
const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log("Gemini Proxy ativo");
});
