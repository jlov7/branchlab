import type {
  ModelProviderAdapter,
  ProviderConfig,
  ReexecRequest,
  ReexecResult,
} from "@branchlab/core";

const openAiAdapter: ModelProviderAdapter = {
  id: "openai",
  capabilities: {
    supportsStreaming: true,
    supportsJsonMode: true,
  },
  async execute(request, config) {
    const key = process.env[config.apiKeyEnv];
    if (!key) {
      throw new Error(`Missing API key in env var ${config.apiKeyEnv}`);
    }

    const response = await fetch(`${config.baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: request.messages,
        temperature: request.temperature ?? 0,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI request failed: ${response.status}`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string }; finish_reason?: string }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };

    return {
      outputText: payload.choices?.[0]?.message?.content ?? "",
      finishReason: payload.choices?.[0]?.finish_reason ?? "stop",
      usage: {
        inputTokens: payload.usage?.prompt_tokens,
        outputTokens: payload.usage?.completion_tokens,
      },
    } satisfies ReexecResult;
  },
};

const compatibleAdapter: ModelProviderAdapter = {
  ...openAiAdapter,
  id: "compatible",
};

const anthropicAdapter: ModelProviderAdapter = {
  id: "anthropic",
  capabilities: {
    supportsStreaming: true,
    supportsJsonMode: false,
  },
  async execute(request, config) {
    const key = process.env[config.apiKeyEnv];
    if (!key) {
      throw new Error(`Missing API key in env var ${config.apiKeyEnv}`);
    }

    const systemPrompt = request.messages.find((message) => message.role === "system")?.content;
    const messages = request.messages
      .filter((message) => message.role !== "system")
      .map((message) => ({ role: message.role, content: message.content }));

    const response = await fetch(`${config.baseUrl}/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: config.model,
        system: systemPrompt,
        messages,
        temperature: request.temperature ?? 0,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic request failed: ${response.status}`);
    }

    const payload = (await response.json()) as {
      content?: Array<{ text?: string }>;
      stop_reason?: string;
      usage?: { input_tokens?: number; output_tokens?: number };
    };

    return {
      outputText: payload.content?.[0]?.text ?? "",
      finishReason: payload.stop_reason ?? "stop",
      usage: {
        inputTokens: payload.usage?.input_tokens,
        outputTokens: payload.usage?.output_tokens,
      },
    } satisfies ReexecResult;
  },
};

export function getAdapter(config: ProviderConfig): ModelProviderAdapter {
  switch (config.kind) {
    case "openai":
      return openAiAdapter;
    case "anthropic":
      return anthropicAdapter;
    case "compatible":
      return compatibleAdapter;
    default:
      return openAiAdapter;
  }
}

export async function executeWithProvider(
  provider: ProviderConfig,
  request: ReexecRequest,
): Promise<ReexecResult> {
  const adapter = getAdapter(provider);
  return adapter.execute(request, provider);
}
