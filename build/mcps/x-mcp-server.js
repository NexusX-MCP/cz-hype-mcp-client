import { createTransport } from "@smithery/sdk/transport.js";
const transport = createTransport("https://server.smithery.ai/@NexusX-MCP/x-v2-server", {
    "xApiKey": process.env.X_API_KEY,
    "xApiSecret": process.env.X_API_SECRET,
    "xAccessToken": process.env.X_ACCESS_TOKEN,
    "xAccessSecret": process.env.X_ACCESS_SECRET
}, process.env.SMITHERY_API_KEY);
export default transport;
