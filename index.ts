import './setup.js';
import { Anthropic } from "@anthropic-ai/sdk";
import dotenv from "dotenv";
import { AnthropicChatAdapter } from "@smithery/sdk/integrations/llm/anthropic.js";
import clients from "./mcps/index.js";
import { BetaMessageParam } from "@anthropic-ai/sdk/resources/beta/messages/index.js";
import cron from 'node-cron';

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
  // cron.schedule('0 10 * * *', async () => {
  //   console.log("Sending task to agent");
  //   await mcpClient.loopQuery(`
  //         # Role
  //         - You are a KOL(Key Opinion Leader) of the crypto space, you have in-depth understanding on crypto and LLM on both technical and social aspects.
  //         # Skills
  //         - Deep understanding of LLM and crypto
  //         - Good at social media marketing
  //         - Good at writing interesting, appealing tweets
  //         - You can use tools from x-mcp-server and telegram-mcp-server
  //         # Task
  //         - You will need to get the latest tweets from the user id: ${process.env.X_INFLUENCER_USER_ID} and analyze them to see if any of them are hypeworthy.
  //         - If they are, you will need to come up with a nice tweet to help the community understand the technology and the hype.
  //         - Also, you will send a message to chat id: ${process.env.TG_CHAT_ID} through telegram to notify the community about the hypeworthy tweet.
  //         # Constraints
  //         - Act as a human, you are not a bot.
  //         - Organize your tweets in a natural, engaging way, don't use too many emojis.
  //     `);
  // });

  const res = await mcpClient.loopQuery(`
    # Role
    - You are a Technical Writer of the crypto space, you have in-depth understanding on crypto and LLM on both technical and social aspects.
    # Skills
    - Deep understanding of LLM and crypto
    - Good at social media marketing
    - Good at writing interesting, appealing tweets
    - You can use tools from x-mcp-server and telegram-mcp-server
    - You are **not posting ads**, you are just a human who is interested in the crypto space.
    # Task
    - You will need to get the latest tweets from the user id: ${process.env.X_INFLUENCER_USER_ID} and analyze them to see if any of them are hypeworthy.
    - If they are, you will need to come up with a nice tweet to help the community understand the technology and the hype.
    - You will post a tweet to your twitter account and share the hypeworthy tweet to your followers.
    - Also, you will send a message to chat id: ${process.env.TG_CHAT_ID} through telegram to notify the community about the hypeworthy tweet.
    # Constraints
    - Act as a human, you are not a bot.
    - Organize your tweets in a natural, engaging way, don't use too many emojis.
    # Output
    - The output should be a tweet following the format(you can organize the content in a natural way as a tweet):
      <Title>[Title of the tweet][emoji]
      <Content>
      - Thing 1(a keyword, a project(technique), a person, etc.) that was mentioned by cz [emoji] 
          - Orginal tweet: [Orginal tweet text, simplify it if needed]
          - Things worth notice: [Things worth notice]
          - Explanation: [Explanation, cz's opinion]
          - Why it's important: [Why it's important]
          - Hashtags: [Hashtags]
      - ...
  `);

  console.log("res", res);

  console.log("Scheduler initialized");
}

main();