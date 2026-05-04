import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
const PORT = 3000;
// ── Exchange rates relative to USD ───────────────────────────────────────────
const RATES = {
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    JPY: 149.5,
    INR: 83.12,
    CAD: 1.36,
    AUD: 1.53,
    CHF: 0.9,
    CNY: 7.24,
    SGD: 1.34,
    AED: 3.67,
};
// ── Build MCP server ─────────────────────────────────────────────────────────
function createMcpServer() {
    const server = new McpServer({ name: "mcp-sample", version: "1.0.0" });
    // Tool 1: Calculator
    server.tool("calculator", "Perform basic arithmetic: add, subtract, multiply, divide", {
        operation: z
            .enum(["add", "subtract", "multiply", "divide"])
            .describe("Operation to perform"),
        a: z.number().describe("First operand"),
        b: z.number().describe("Second operand"),
    }, async ({ operation, a, b }) => {
        const ops = { add: "+", subtract: "−", multiply: "×", divide: "÷" };
        if (operation === "divide" && b === 0) {
            return {
                isError: true,
                content: [{ type: "text", text: "Error: division by zero." }],
            };
        }
        const result = operation === "add"
            ? a + b
            : operation === "subtract"
                ? a - b
                : operation === "multiply"
                    ? a * b
                    : a / b;
        return {
            content: [{ type: "text", text: `${a} ${ops[operation]} ${b} = ${result}` }],
        };
    });
    // Tool 2: Currency Converter
    server.tool("currency_converter", `Convert an amount between currencies. Supported: ${Object.keys(RATES).join(", ")}`, {
        amount: z.number().positive().describe("Amount to convert"),
        from: z.string().describe("Source currency code, e.g. USD"),
        to: z.string().describe("Target currency code, e.g. EUR"),
    }, async ({ amount, from, to }) => {
        const src = from.toUpperCase();
        const dst = to.toUpperCase();
        const supported = Object.keys(RATES).join(", ");
        if (!RATES[src])
            return {
                isError: true,
                content: [{ type: "text", text: `Unknown currency "${src}". Supported: ${supported}` }],
            };
        if (!RATES[dst])
            return {
                isError: true,
                content: [{ type: "text", text: `Unknown currency "${dst}". Supported: ${supported}` }],
            };
        const converted = parseFloat(((amount / RATES[src]) * RATES[dst]).toFixed(4));
        const rate = parseFloat((RATES[dst] / RATES[src]).toFixed(6));
        return {
            content: [
                {
                    type: "text",
                    text: [
                        `${amount} ${src} = ${converted} ${dst}`,
                        `Rate: 1 ${src} = ${rate} ${dst}`,
                        "(Static demo rates — replace with a live API for production)",
                    ].join("\n"),
                },
            ],
        };
    });
    return server;
}
// ── Express HTTP server ──────────────────────────────────────────────────────
const app = express();
app.use(express.json());
// Each POST to /mcp gets a fresh stateless transport + server instance
app.post("/mcp", async (req, res) => {
    const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined, // stateless — no session bookkeeping needed
    });
    const server = createMcpServer();
    await server.connect(transport);
    try {
        await transport.handleRequest(req, res, req.body);
    }
    finally {
        await server.close();
    }
});
// Health-check
app.get("/health", (_req, res) => {
    res.json({ status: "ok", tools: ["calculator", "currency_converter"] });
});
app.listen(PORT, () => {
    console.log(`MCP server listening on http://localhost:${PORT}`);
    console.log(`  POST http://localhost:${PORT}/mcp   — MCP JSON-RPC endpoint`);
    console.log(`  GET  http://localhost:${PORT}/health — health check`);
});
