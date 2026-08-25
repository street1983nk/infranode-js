Deutsch | [English](https://github.com/street1983nk/infranode-js/blob/main/README.en.md)

# infranode-sdk

Schlüsselloser TypeScript-Client für die [InfraNode](https://infranode.dev) Open-Data-API,
mit einem Tool für das [Vercel AI SDK](https://sdk.vercel.ai).

InfraNode bündelt offene Verwaltungsdaten für **84 deutsche Städte** (Wetter, Luftqualität,
Strompreise, Bodenrichtwerte, ÖPNV, E-Ladesäulen, Demografie und mehr) hinter einem
einheitlichen JSON-Envelope. **Kein API-Key, keine Registrierung.** Läuft in Node 18+ und
im Browser.

```bash
npm install infranode-sdk
```

## Schnellstart

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

Jeder Record trägt seine eigene `attribution` (Quelle plus Lizenz-URL). Die Open-Data-Lizenzen
verlangen eine Quellenangabe, zeige sie deshalb deinen Nutzern an.

Fehler werfen einen `InfraNodeError`:

```ts
import { InfraNode, InfraNodeError } from "infranode-sdk";

try {
  await new InfraNode().record("atlantis", "weather");
} catch (e) {
  if (e instanceof InfraNodeError) console.log(e.code, e.message);
}
```

## Als KI-Agenten-Tool nutzen (Vercel AI SDK)

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

`infranodeTools()` liefert `infranode_get_city_data(city, dataset)` und
`infranode_list_cities()`. Die Tool-Beschreibung listet alle gültigen Datasets auf, damit
das Modell das richtige wählt. Wenn deine Laufzeitumgebung MCP spricht, ist der offizielle
[InfraNode-MCP-Server](https://infranode.dev) (`https://mcp.infranode.dev/mcp`) die bessere
Wahl; dieses Tool ist die leichtgewichtige Alternative ohne MCP.

## Datasets

`weather`, `air`, `power-price`, `power-load`, `charging`, `sharing`,
`fuel-prices`, `pollen-uv`, `water-level`, `transit`, `station-departures`,
`demographics`, `land-values`, `election`, `tourism`, `accidents` und weitere. Die
vollständige Routenliste steht unter `https://infranode.dev/api/v1/openapi.yaml`.

## Über InfraNode

- API: https://infranode.dev (schlüssellos, Rate-Limit 300 req/min/IP)
- MCP-Server: `https://mcp.infranode.dev/mcp`
- API-Quellcode (Apache-2.0): https://github.com/street1983nk/infranode

## Lizenz

Apache-2.0. Die Daten bleiben unter den Lizenzen der jeweiligen Quellen und sind über
das Feld `attribution` jedes Records ausgewiesen.
