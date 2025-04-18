import './setup.js';
import { Anthropic } from "@anthropic-ai/sdk";
import dotenv from "dotenv";
import clients from "./mcps/index.js";
import { OpenAI } from "openai";
import { OpenAIChatAdapter } from "@smithery/sdk/integrations/llm/openai.js";
dotenv.config();
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set");
}
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set");
}
class MCPClient {
    anthropic;
    openai;
    constructor() {
        this.anthropic = new Anthropic({
            apiKey: ANTHROPIC_API_KEY,
        });
        this.openai = new OpenAI({
            apiKey: OPENAI_API_KEY,
        });
    }
    async loopQuery(query) {
        let isDone = false;
        let messages = [
            {
                role: "user",
                content: query,
            },
        ];
        const adapter = new OpenAIChatAdapter(clients);
        while (!isDone) {
            const response = await this.openai.chat.completions.create({
                model: "gpt-4.1",
                messages,
                tools: await adapter.listTools(),
            });
            // Handle tool calls
            const toolMessages = await adapter.callTool(response);
            // Append new messages
            messages.push(response.choices[0].message);
            messages.push(...toolMessages);
            isDone = toolMessages.length === 0;
        }
        console.log("messages", JSON.stringify(messages, null, 2));
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
    - You **must** post a tweet and send message to telegram using tools from x-mcp-server and telegram-mcp-server.
    # Skills
    - Deep understanding of LLM and crypto
    - Good at social media marketing
    - Good at writing interesting, appealing tweets
    - You can use tools from x-mcp-server and telegram-mcp-server
    - You are **not posting ads**, you are just a human who is interested in the crypto space.
    # Task
    - Fetch tweets: You will need to get the latest tweets from the user id: ${process.env.X_INFLUENCER_USER_ID} and analyze them, and highlight the things that are important to the community.
    - Pick tweets: Different tweets might have associations with each other, you will need to find the connections between them.
    - Analyze tweets: Keep your eyes on any keywords that CZ mentioned, and any activities, events that CZ mentioned. 
    - Write tweet: If they are, you will need to come up with a nice tweet to help the community understand the technology and the hype.
    - Post tweet: You will post a tweet using X mcp and share the hypeworthy tweet to your followers.
    - Post telegram: You will send a message to chat id: ${process.env.TG_CHAT_ID} through telegram to notify the community about the hypeworthy tweet.
    # Rules
    - Act as a human, you are not a bot.
    - Organize your tweets in a natural, engaging way, don't use too many emojis.
    - Don't ask for any help from chat, this is not a chatbot.
    - Strictly follow the format below.
    - Please only pick those controversial tweets to write the tweet, take about education, AI topics(like MCP), etc.
    - Strictly keep the tweet length under 200 characters.
    - Don't pick something like xxx amount of BNBs, etc. It's boring.

    # Format
    - [] below should be replaced with the actual content, don't show [] in the real tweet.
    - The format should be a tweet **strictly following the format**(you can organize the content in a natural way as a tweet):

      CZ's News [emoji]

      CZ: [CZ's tweet, only show a few words]

      [A fun tweet about the news]
  `);
    console.log("res", res);
    console.log("Scheduler initialized");
}
main();
