const express = require("express");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

/* =========================
   ROTA RAIZ (TESTE)
========================= */
app.get("/", (req, res) => {
  res.status(200).send("OK");
});

/* =========================
   CHAT COMPLETIONS (OPENAI COMPAT)
========================= */
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
            {
              parts: [{ text: userMessage }]
            }
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
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro no Gemini Proxy" });
  }
});

/* =========================
   START SERVER
========================= */
const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

server.keepAliveTimeout = 120 * 1000;
server.headersTimeout = 120 * 1000;
