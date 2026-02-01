const express = require("express");

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

/**
 * ROTA DE SAÚDE (RAIZ)
 * Teste: curl https://SEU-URL.onrender.com/
 */
app.get("/", (req, res) => {
  res.status(200).send("Gemini Proxy ONLINE");
});

/**
 * ROTA COMPATÍVEL COM OPENAI /v1/chat/completions
 */
app.post("/v1/chat/completions", async (req, res) => {
  try {
    const messages = req.body.messages || [];
    const userMessage = messages.map(m => m.content).join("\n");

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
    return res.status(500).json({ error: "Erro no Gemini Proxy" });
  }
});

app.listen(port, () => {
  console.log(`Gemini Proxy rodando na porta ${port}`);
});
