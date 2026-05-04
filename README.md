# MCP Sample Server

A stateless **Model Context Protocol (MCP)** server built with TypeScript, Express, and the official MCP SDK. Exposes two tools — a calculator and a currency converter — over HTTP JSON-RPC.

## Tools

| Tool | Description |
|------|-------------|
| `calculator` | Perform basic arithmetic: add, subtract, multiply, divide |
| `currency_converter` | Convert amounts between 11 supported currencies using static rates |

### Supported Currencies

USD, EUR, GBP, JPY, INR, CAD, AUD, CHF, CNY, SGD, AED

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/mcp` | MCP JSON-RPC endpoint |
| `GET` | `/health` | Health check |

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install & Run

```bash
npm install
npm run dev
```

Server starts on `http://localhost:3000`.

### Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `build` | `npm run build` | Compile TypeScript to `dist/` |
| `start` | `npm start` | Run compiled output |
| `dev` | `npm run dev` | Build + run in one step |

## Testing

### Health Check

```bash
curl http://localhost:3000/health
```

```json
{ "status": "ok", "tools": ["calculator", "currency_converter"] }
```

### List Tools

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

### Calculator — Addition

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "calculator",
      "arguments": { "operation": "add", "a": 10, "b": 5 }
    }
  }'
```

**Response:** `10 + 5 = 15`

### Currency Converter — USD to INR

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "currency_converter",
      "arguments": { "amount": 100, "from": "USD", "to": "INR" }
    }
  }'
```

**Response:**
```
100 USD = 8312 INR
Rate: 1 USD = 83.12 INR
(Static demo rates — replace with a live API for production)
```

### PowerShell

```powershell
$body = @{
  jsonrpc = "2.0"; id = 1; method = "tools/call"
  params  = @{ name = "calculator"; arguments = @{ operation = "multiply"; a = 6; b = 7 } }
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Uri "http://localhost:3000/mcp" -Method POST -ContentType "application/json" -Body $body
```

### MCP Inspector (GUI)

```bash
npx @modelcontextprotocol/inspector
```

Open the printed URL, set transport to **HTTP**, and connect to `http://localhost:3000/mcp`.

## Architecture

```
AI Client (e.g. Claude)
       │
       │  POST /mcp  (JSON-RPC 2.0)
       ▼
  Express HTTP Server (port 3000)
       │
       ▼
  MCP Server — stateless, fresh instance per request
       │
       ├── Tool: calculator
       └── Tool: currency_converter
```

Each POST to `/mcp` creates a fresh server + transport pair with no session state, making the server horizontally scalable and easy to deploy.

## Project Structure

```
mcp-sample-server/
├── src/
│   └── index.ts        # Server entry point — tools + HTTP setup
├── dist/               # Compiled output (after build)
├── package.json
└── tsconfig.json
```

## Dependencies

| Package | Purpose |
|---------|---------|
| `@modelcontextprotocol/sdk` | MCP server + transport primitives |
| `express` | HTTP server |
| `zod` | Schema validation for tool inputs |
| `typescript` | Type safety |
