export const SONNET = "claude-sonnet-4-6";
export const HAIKU = "claude-haiku-4-5-20251001";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

interface CallClaudeOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

async function callAnthropicAPI(
  apiKey: string,
  model: string,
  system: string,
  user: string,
  temperature: number,
  maxTokens: number,
): Promise<Response> {
  return fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      system,
      messages: [{ role: "user", content: user }],
      max_tokens: maxTokens,
      temperature,
    }),
  });
}

export async function callClaude(
  system: string,
  user: string,
  options: CallClaudeOptions = {},
): Promise<string> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const {
    model = SONNET,
    temperature = 0.3,
    maxTokens = 4096,
  } = options;

  let response = await callAnthropicAPI(apiKey, model, system, user, temperature, maxTokens);

  // On rate-limit or overload, retry once with Haiku if not already using it
  if ((response.status === 429 || response.status === 529) && model !== HAIKU) {
    console.warn(`Anthropic ${response.status} on ${model}, retrying with ${HAIKU}`);
    response = await callAnthropicAPI(apiKey, HAIKU, system, user, temperature, maxTokens);
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${body}`);
  }

  const data = await response.json();
  const text = data?.content?.[0]?.text;
  if (!text) throw new Error("Empty response from Anthropic API");
  return text;
}

export function extractJson(text: string): unknown {
  const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
  return JSON.parse(cleaned);
}
