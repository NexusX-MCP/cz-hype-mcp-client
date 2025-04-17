import { createTransport } from "@smithery/sdk/transport.js";
import dotenv from "dotenv";
dotenv.config();
// console.log("TG_MCP_TOKEN:", process.env.TG_MCP_TOKEN)
const transport = createTransport("https://server.smithery.ai/@NexusX-MCP/telegram-mcp-server", {
    "telegramBotToken": process.env.TG_MCP_TOKEN,
}, process.env.SMITHERY_API_KEY);
// Create MCP client
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
const client = new Client({
    name: "Test client",
    version: "1.0.0"
});
await client.connect(transport);
// Use the server tools with your LLM application
const tools = await client.listTools();
console.log(tools);
// Example: Call a tool
// const result = await client.callTool("tool_name", { param1: "value1" })
export default client;
