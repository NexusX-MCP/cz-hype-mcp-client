import './setup.js';
import { Anthropic } from "@anthropic-ai/sdk";
import dotenv from "dotenv";
import { AnthropicChatAdapter } from "@smithery/sdk/integrations/llm/anthropic.js";
import clients from "./mcps/index.js";
import { BetaMessageParam } from "@anthropic-ai/sdk/resources/beta/messages/index.js";

dotenv.config();

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  throw new Error("ANTHROPIC_API_KEY is not set");
}

class MCPClient {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: ANTHROPIC_API_KEY,
    });
  }

  async loopQuery(query: string) {
    let isDone = false;

    const chatState = {
      type: "anthropic" as const,
      llm: new Anthropic(),
      messages: [] as BetaMessageParam[],
    };

    chatState.messages.push({
      role: "user",
      content: query,
    });

    while (!isDone) {
      const adapter = new AnthropicChatAdapter(clients);
      const response = await chatState.llm.beta.messages.create({
				model: "claude-3-5-sonnet-20241022",
				max_tokens: 2056,
				messages: chatState.messages,
				tools: await adapter.listTools(),
			});
      chatState.messages.push({
				role: response.role,
				content: response.content,
			});
			const toolMessages = await adapter.callTool(response as any);
			chatState.messages.push(...toolMessages);
			isDone = toolMessages.length === 0;
    }

    console.log("messages", JSON.stringify(chatState.messages, null, 2));
  }
}

async function main() {
  const mcpClient = new MCPClient();
  try {
    await mcpClient.loopQuery(`Send a message to the user with the text 'Hello, how are you?' to chat id: ${process.env.TG_CHAT_ID}`);
  } finally {
    process.exit(0);
  }
}

main().catch((err) => {
	console.error("Error:", err)
	process.exit(1)
});