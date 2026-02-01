const express = require("express");
const app = express();

const port = process.env.PORT || 3001;

/* ========= MIDDLEWARE ========= */
app.use(express.json());

/* ========= ROTA RAIZ (HEALTHCHECK) ========= */
app.get("/", (req, res) => {
  res.status(200).send("OK");
});

/* ========= CHAT COMPLETIONS (OPENAI COMPATÍVEL) ========= */
app.post("/v1/chat/completions", async (req, res) => {
  try {
    const userMessage =
      req.body?.messages?.map(m => m.content).join("\n") || "";

    if (!userMessage) {
      return res.status(400).json({ error: "Mensagem vazia" });
    }

    const response = await fetch(
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
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro no Gemini Proxy" });
  }
});

/* ========= START SERVER ========= */
const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

server.keepAliveTimeout = 120 * 1000;
server.headersTimeout = 120 * 1000;
