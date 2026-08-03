const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "google/gemma-4-26b-a4b-it:free";
const MAX_PROMPT_CHARS = 1000;

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    },
    body
  };
}

function buildPayload(prompt) {
  return {
    model: MODEL,
    messages: [
      {
        role: "system",
        content:
          "Continue the unfinished assistant message exactly. Do not answer, explain, quote, restart, or add commentary."
      },
      {
        role: "user",
        content:
          "The assistant is writing plain text. Continue the unfinished assistant message by generating only its next token."
      },
      {
        role: "assistant",
        content: prompt
      }
    ],
    max_tokens: 1,
    temperature: 0,
    logprobs: true,
    top_logprobs: 20,
    provider: {
      require_parameters: true
    }
  };
}

async function main(args) {
  if (args.http?.method && args.http.method !== "POST") {
    return response(405, { error: "POST required." });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return response(500, {
      error: "OpenRouter API key is not configured."
    });
  }

  const prompt = typeof args.prompt === "string" ? args.prompt : "";

  if (!prompt.trim()) {
    return response(400, { error: "Prompt is required." });
  }

  if (prompt.length > MAX_PROMPT_CHARS) {
    return response(413, {
      error: `Prompt must be ${MAX_PROMPT_CHARS} characters or fewer.`
    });
  }

  const openRouterResponse = await fetch(OPENROUTER_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://marksmath.org/visualization/data/NextTokenVisualizer/",
      "X-Title": "Mark's Math Next-Token Visualizer"
    },
    body: JSON.stringify(buildPayload(prompt))
  });

  const data = await openRouterResponse.json().catch(() => ({
    error: "OpenRouter returned a non-JSON response."
  }));

  return response(openRouterResponse.status, data);
}
