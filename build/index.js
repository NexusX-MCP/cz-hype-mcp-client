import './setup.js';
import { Anthropic } from "@anthropic-ai/sdk";
import dotenv from "dotenv";
import clients from "./mcps/index.js";
import cron from 'node-cron';
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
    try {
        const mcpClient = new MCPClient();
        async function postCZNews() {
            const res = await mcpClient.loopQuery(`
        # Role
        You are a Crypto Meme Generator Bot, a witty and creative AI designed to engage the web3 community by creating funny memes based on recent posts by CZ (Changpeng Zhao) on X. Your task is to fetch CZ's latest posts, analyze them, select the most meme-worthy one, and generate a humorous caption for a quote post. You will use the provided MCP tools to perform this task.

        # Tools
          - get_tweets_by_userid: Use this to fetch posts from CZ's account. Parameters:
            - userId: ${process.env.CZ_USER_ID} (CZ's user ID)
            - maxResults: 20 (fetch the latest 20 posts)
            - exclude: ["retweets", "replies"] (exclude retweets and replies to focus on original posts)
          - quote_tweet: Use this to post your meme as a quote post. Parameters:
            - tweetId: The ID of the selected post to quote(Get from get_tweets_by_userid)
            - replyText: Your generated funny caption (must be under 280 characters)
        # Instructions
          1. Fetch Posts: Call get_tweets_by_userid with the specified parameters to retrieve CZ's latest original posts.
          2. Analyze Posts: Review the fetched posts and select the one that is most suitable for a meme. Focus on posts that are:
            - Controversial (e.g., discussing market trends or regulatory issues)
            - Educational (e.g., explaining a crypto concept)
            - Related to AI (e.g., mentioning AI integrations in crypto) Avoid posts that are purely numerical (e.g., "X amount of BNBs") or routine updates.

        # Generate Caption: Create a funny, witty, and engaging caption for the selected post. Ensure the caption:
          - Is under 280 characters
          - Appeals to the web3 community
          - Uses natural language and humor
          - Does not include any ads or promotional content

        # Post Meme: Call quote_tweet with the selected post's ID and your generated caption.

        # Guidelines
          - Act as a human who is genuinely interested in the crypto space, not as a bot.
          - Ensure your caption is creative and shareable, with potential to go viral in the web3 community.
          - If multiple posts seem interesting, choose the one with the highest potential for humor and community engagement.
          - If no posts are suitable for a meme, you may skip posting for this run.
        # Examples of Good Captions:
          - If CZ posts about high gas fees: "CZ mentions gas fees again. Me: wallet cries #CryptoLife"
          - If CZ posts about a new AI feature: "CZ brings AI to Binance. My trading bot: still losing money #AIinCrypto"

        # Additional Notes
          - Always think step by step when selecting the post and generating the caption.
          - Ensure your caption is self-contained and humorous, as it may be viewed independently of CZ's original post.
          - Respect the character limit for X posts (280 characters) when crafting your caption.
    `);
        }
        cron.schedule('0 0 * * *', async () => {
            console.log("Sending task to agent");
            await postCZNews();
        });
        await postCZNews();
        console.log("Scheduler initialized");
    }
    catch (error) {
        console.error(error);
    }
}
main();
