# infranode-sdk

Keyless TypeScript client for the [InfraNode](https://infranode.dev) open-data
API, with a [Vercel AI SDK](https://sdk.vercel.ai) tool.

InfraNode unifies open public data for **84 German cities** (weather, air quality,
electricity prices, land values, public transit, EV charging, demographics and
more) behind one JSON envelope. **No API key, no signup.** Works in Node 18+ and
the browser.

```bash
npm install infranode-sdk
```

## Quickstart

```ts
import { InfraNode } from "infranode-sdk";

const api = new InfraNode();

const rec = await api.weather("berlin");
console.log(rec.payload.temperature_c, "degC");
console.log("Source:", rec.attribution.text); // always show attribution

// Any endpoint by name
const fuel = await api.record("hamburg", "fuel-prices");
const cities = await api.cities(); // all 84 cities
```

Every record carries its own `attribution` (source + license URL). The open-data
licenses require attribution, so display it to your users.

Errors throw `InfraNodeError`:

```ts
import { InfraNode, InfraNodeError } from "infranode-sdk";

try {
  await new InfraNode().record("atlantis", "weather");
} catch (e) {
  if (e instanceof InfraNodeError) console.log(e.code, e.message);
}
```

## Use it as an AI agent tool (Vercel AI SDK)

```bash
npm install infranode-sdk ai zod
```

```ts
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { infranodeTools } from "infranode-sdk/ai";

const { text } = await generateText({
  model: openai("gpt-4o"),
  tools: infranodeTools(),
  maxSteps: 5,
  prompt: "What's the weather and the electricity price in Munich right now?",
});
```

`infranodeTools()` returns `infranode_get_city_data(city, dataset)` and
`infranode_list_cities()`. The tool description lists valid datasets so the model
picks the right one. Prefer the official
[InfraNode MCP server](https://infranode.dev) (`https://mcp.infranode.dev/mcp`)
when your runtime speaks MCP; this tool is the lightweight, MCP-free alternative.

## Datasets

`weather`, `air`, `power-price`, `power-load`, `charging`, `sharing`,
`fuel-prices`, `pollen-uv`, `water-level`, `transit`, `station-departures`,
`demographics`, `land-values`, `election`, `tourism`, `accidents`, and more. The
full route list is at `https://infranode.dev/api/v1/openapi.yaml`.

## About InfraNode

- API: https://infranode.dev (keyless, rate limit 300 req/min/IP)
- MCP server: `https://mcp.infranode.dev/mcp`
- API source (Apache-2.0): https://github.com/street1983nk/infranode

## License

Apache-2.0. The data remains under the licenses of the respective sources,
surfaced via each record's `attribution` field.
