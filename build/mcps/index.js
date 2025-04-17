import { MultiClient } from "@smithery/sdk";
import tgTransport from "./tg-mcp-server.js";
import xTransport from "./x-mcp-server.js";
const clients = new MultiClient();
await clients.connectAll({
    telegramMCP: tgTransport,
    xMCP: xTransport,
});
console.log(await clients.listTools());
export default clients;
