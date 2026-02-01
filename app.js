const express = require("express");

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

/**
 * Rota raiz (teste simples)
 */
app.get("/", (req, res) => {
  res.status(200).send("Gemini Proxy ONLINE");
});

/**
 * Rota compatível com OpenAI Chat Completions
 */
app.post("/v1/chat/completions", async (req, res) => {
  try {
    const messages = req.body?.messages || [];

    const prompt = messages.map(m => m.content).join("\n");

    if (!prompt) {
      return res.status(400).json({ error: "Mensagem vazia" });
    }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL}:generateContent?key=${process.env.GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
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
    return res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Gemini Proxy rodando na porta ${port}`);
});
