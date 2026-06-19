import { describe, expect, it, vi } from "vitest";
import { InfraNode, InfraNodeError } from "../src/index.js";
import { infranodeTools } from "../src/ai.js";

const WEATHER = {
  data: {
    city_slug: "berlin",
    observed_at: "2026-06-19T20:30:00Z",
    retrieved_at: "2026-06-19T20:45:00Z",
    source: "dwd",
    license_id: "geonutzv",
    attribution: { text: "Deutscher Wetterdienst", license_url: "https://dwd.de" },
    payload: { kind: "weather", temperature_c: 23.6, humidity: 74 },
  },
  meta: { source_status: "ok" },
};

const ERROR = {
  error: { code: "not_found", message: "nicht gefunden", hint: "Pfad pruefen" },
  meta: {},
};

const CITIES = { data: [{ slug: "berlin", name_de: "Berlin", state: "BE" }] };

function mockFetch(body: unknown, ok = true) {
  return vi.fn(async () =>
    new Response(JSON.stringify(body), {
      status: ok ? 200 : 404,
      headers: { "content-type": "application/json" },
    }),
  ) as unknown as typeof fetch;
}

describe("InfraNode client", () => {
  it("unwraps the payload from the envelope", async () => {
    const api = new InfraNode({ fetch: mockFetch(WEATHER) });
    const rec = await api.weather("berlin");
    expect(rec.payload.temperature_c).toBe(23.6);
    expect(rec.attribution.text).toBe("Deutscher Wetterdienst");
    expect(rec.observed_at).toBe("2026-06-19T20:30:00Z");
  });

  it("builds a normalized URL", async () => {
    const f = mockFetch(WEATHER);
    const api = new InfraNode({ fetch: f });
    await api.weather("  BERLIN  ");
    expect(f).toHaveBeenCalledWith(
      "https://infranode.dev/api/v1/cities/berlin/weather",
      expect.anything(),
    );
  });

  it("throws InfraNodeError on an error envelope", async () => {
    const api = new InfraNode({ fetch: mockFetch(ERROR, false) });
    await expect(api.weather("atlantis")).rejects.toMatchObject({
      name: "InfraNodeError",
      code: "not_found",
      hint: "Pfad pruefen",
    });
    expect(InfraNodeError).toBeTruthy();
  });

  it("lists cities", async () => {
    const api = new InfraNode({ fetch: mockFetch(CITIES) });
    const cities = await api.cities();
    expect(cities[0]?.slug).toBe("berlin");
  });
});

describe("Vercel AI SDK tools", () => {
  it("exposes both tools with working execute", async () => {
    const tools = infranodeTools({ fetch: mockFetch(WEATHER) });
    expect(Object.keys(tools)).toEqual([
      "infranode_get_city_data",
      "infranode_list_cities",
    ]);
    const out = (await tools.infranode_get_city_data.execute!(
      { city: "berlin", dataset: "weather" },
      { toolCallId: "t1", messages: [] },
    )) as unknown as { payload: { temperature_c: number }; attribution: { text: string } };
    expect(out.payload.temperature_c).toBe(23.6);
    expect(out.attribution.text).toBe("Deutscher Wetterdienst");
  });

  it("returns a structured error from the tool instead of throwing", async () => {
    const tools = infranodeTools({ fetch: mockFetch(ERROR, false) });
    const out = (await tools.infranode_get_city_data.execute!(
      { city: "atlantis", dataset: "weather" },
      { toolCallId: "t2", messages: [] },
    )) as unknown as { error: string };
    expect(out.error).toBe("not_found");
  });
});
