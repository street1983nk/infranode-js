/**
 * Keyless TypeScript client for the InfraNode open-data API.
 *
 * InfraNode unifies open public data for 84 German cities behind one JSON
 * envelope. No API key, no signup. Works in Node 18+ and the browser (uses the
 * global `fetch`).
 *
 *   import { InfraNode } from "infranode-sdk";
 *   const api = new InfraNode();
 *   const rec = await api.weather("berlin");
 *   console.log(rec.payload.temperature_c, rec.attribution.text);
 *
 * Docs:   https://infranode.dev
 * Source: https://github.com/street1983nk/infranode (Apache-2.0)
 */

export const DEFAULT_BASE_URL = "https://infranode.dev/api/v1";

export interface Attribution {
  text: string;
  license_url: string;
  modified?: boolean;
}

/** A single InfraNode city record (the `data` object of the envelope). */
export interface InfraNodeRecord<P = Record<string, unknown>> {
  city_slug: string;
  payload: P;
  attribution: Attribution;
  source: string | null;
  license_id: string | null;
  observed_at: string | null;
  retrieved_at: string | null;
  /** The full, unmodified `data` object from the envelope. */
  raw: Record<string, unknown>;
}

export interface City {
  slug: string;
  name_de: string;
  state: string;
  population: number;
  geo: { lat: number; lon: number };
  coverage: string;
}

/** Thrown when the API returns a structured error envelope. */
export class InfraNodeError extends Error {
  constructor(
    public code: string,
    message: string,
    public hint?: string,
  ) {
    super(message);
    this.name = "InfraNodeError";
  }
}

export interface InfraNodeOptions {
  baseUrl?: string;
  /** Custom fetch implementation (defaults to the global `fetch`). */
  fetch?: typeof fetch;
}

function normalizeSlug(slug: string): string {
  return encodeURIComponent(slug.trim().toLowerCase());
}

export class InfraNode {
  readonly baseUrl: string;
  private readonly _fetch: typeof fetch;

  constructor(options: InfraNodeOptions = {}) {
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    const f = options.fetch ?? globalThis.fetch;
    if (!f) {
      throw new Error(
        "No fetch available. Use Node 18+ or pass a fetch implementation via options.fetch.",
      );
    }
    this._fetch = f.bind(globalThis);
  }

  private async get<T>(path: string, signal?: AbortSignal): Promise<T> {
    const res = await this._fetch(`${this.baseUrl}${path}`, {
      headers: { Accept: "application/json" },
      signal,
    });
    const body = (await res.json()) as {
      data?: T;
      error?: { code: string; message: string; hint?: string };
    };
    if (!res.ok || body.error) {
      const err = body.error ?? { code: String(res.status), message: res.statusText };
      throw new InfraNodeError(err.code, err.message, err.hint);
    }
    return body.data as T;
  }

  /** Fetch any single-city endpoint, e.g. `record("hamburg", "fuel-prices")`. */
  record<P = Record<string, unknown>>(
    slug: string,
    endpoint: string,
    signal?: AbortSignal,
  ): Promise<InfraNodeRecord<P>> {
    return this.get<InfraNodeRecord<P>>(
      `/cities/${normalizeSlug(slug)}/${endpoint}`,
      signal,
    );
  }

  /** List all covered German cities. */
  cities(signal?: AbortSignal): Promise<City[]> {
    return this.get<City[]>("/cities", signal);
  }

  /** List all data sources with license and attribution. */
  sources(signal?: AbortSignal): Promise<Array<Record<string, unknown>>> {
    return this.get("/sources", signal);
  }

  weather(slug: string, signal?: AbortSignal) {
    return this.record(slug, "weather", signal);
  }
  air(slug: string, signal?: AbortSignal) {
    return this.record(slug, "air", signal);
  }
  powerPrice(slug: string, signal?: AbortSignal) {
    return this.record(slug, "power-price", signal);
  }
  charging(slug: string, signal?: AbortSignal) {
    return this.record(slug, "charging", signal);
  }
}
