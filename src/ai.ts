/**
 * Vercel AI SDK tools for InfraNode.
 *
 *   npm install infranode-sdk ai zod
 *
 *   import { generateText } from "ai";
 *   import { openai } from "@ai-sdk/openai";
 *   import { infranodeTools } from "infranode-sdk/ai";
 *
 *   const { text } = await generateText({
 *     model: openai("gpt-4o"),
 *     tools: infranodeTools(),
 *     prompt: "What's the weather and electricity price in Munich right now?",
 *   });
 *
 * Prefer the official InfraNode MCP server (https://mcp.infranode.dev/mcp) when
 * your runtime speaks MCP; these tools are the lightweight, MCP-free alternative.
 */

import { tool } from "ai";
import { z } from "zod";
import { InfraNode, InfraNodeError, type InfraNodeOptions } from "./index.js";

const DATASETS = [
  "weather",
  "air",
  "power-price",
  "power-load",
  "charging",
  "sharing",
  "fuel-prices",
  "pollen-uv",
  "water-level",
  "transit",
  "station-departures",
  "demographics",
  "land-values",
  "election",
  "tourism",
  "accidents",
] as const;

/**
 * Build the InfraNode tool set for `generateText` / `streamText`.
 * Returns an object you can spread into the `tools` option.
 */
export function infranodeTools(options: InfraNodeOptions = {}) {
  const api = new InfraNode(options);

  return {
    infranode_get_city_data: tool({
      description:
        "Get live open public data for a German city from InfraNode (keyless, 84 " +
        "cities). Returns the data payload plus the source attribution, which must " +
        "be shown to the user.",
      parameters: z.object({
        city: z
          .string()
          .describe("City as a lowercase slug, e.g. 'berlin', 'muenchen', 'koeln'."),
        dataset: z.enum(DATASETS).describe("Which dataset to fetch."),
      }),
      execute: async ({ city, dataset }) => {
        try {
          const rec = await api.record(city, dataset);
          return {
            city: rec.city_slug,
            dataset,
            payload: rec.payload,
            observed_at: rec.observed_at,
            attribution: rec.attribution,
          };
        } catch (err) {
          if (err instanceof InfraNodeError) {
            return { error: err.code, message: err.message, hint: err.hint };
          }
          throw err;
        }
      },
    }),

    infranode_list_cities: tool({
      description: "List all German cities covered by InfraNode (slug, name, state).",
      parameters: z.object({}),
      execute: async () => {
        const cities = await api.cities();
        return cities.map((c) => ({ slug: c.slug, name: c.name_de, state: c.state }));
      },
    }),
  };
}
