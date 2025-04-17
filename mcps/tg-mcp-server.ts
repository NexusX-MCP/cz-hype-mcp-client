
import { createTransport } from "@smithery/sdk/transport.js"
import dotenv from "dotenv"

dotenv.config()

// console.log("TG_MCP_TOKEN:", process.env.TG_MCP_TOKEN)

const transport = createTransport("https://server.smithery.ai/@NexusX-MCP/telegram-mcp-server", {
  "telegramBotToken": process.env.TG_MCP_TOKEN,
}, process.env.SMITHERY_API_KEY);

export default transport;