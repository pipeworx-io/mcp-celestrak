interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * CelesTrak MCP — satellite orbital elements (TLE / GP data) for any tracked object.
 *
 * Keyless. CelesTrak is run by a single maintainer; we send a polite User-Agent and keep
 * usage light. This is the ORBITAL CATALOG (general-perturbations element sets), distinct
 * from live position tracking.
 */


const BASE = 'https://celestrak.org/NORAD/elements/gp.php';
const UA = 'pipeworx/1.0 (+https://pipeworx.io)';

type Gp = Record<string, unknown>;

const mapGp = (o: Gp) => ({
  name: o.OBJECT_NAME,
  object_id: o.OBJECT_ID,
  norad_id: o.NORAD_CAT_ID,
  epoch: o.EPOCH,
  mean_motion_rev_per_day: o.MEAN_MOTION,
  eccentricity: o.ECCENTRICITY,
  inclination_deg: o.INCLINATION,
  raan_deg: o.RA_OF_ASC_NODE,
  arg_perigee_deg: o.ARG_OF_PERICENTER,
  mean_anomaly_deg: o.MEAN_ANOMALY,
  period_minutes: o.MEAN_MOTION ? Math.round(1440 / (o.MEAN_MOTION as number)) : null,
});

const tools: McpToolExport['tools'] = [
  {
    name: 'get_satellite',
    description:
      'Get satellite orbital elements (TLE / GP data) for a single object by NORAD catalog ID. ' +
      'Returns orbital parameters: inclination, eccentricity, mean motion, RAAN, argument of perigee, ' +
      'epoch, and derived orbital period in minutes. norad_id 25544 = ISS, 20580 = Hubble. ' +
      'This is the orbital catalog, not live position tracking.',
    inputSchema: {
      type: 'object',
      properties: {
        norad_id: { type: 'number', description: 'NORAD catalog ID, e.g. 25544 (ISS) or 20580 (Hubble).' },
      },
      required: ['norad_id'],
    },
  },
  {
    name: 'search_by_name',
    description:
      'Search the satellite catalog by name substring and return matching orbital elements (TLE / GP data). ' +
      'e.g. "STARLINK", "NOAA", "GPS". Returns up to 50 matches with orbital parameters ' +
      '(inclination, eccentricity, period). Catalog/orbital data, not live tracking.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Satellite name substring, e.g. "STARLINK" or "NOAA".' },
      },
      required: ['name'],
    },
  },
  {
    name: 'get_group',
    description:
      'List orbital elements (TLE / GP data) for an entire CelesTrak group — e.g. the Starlink, GPS, ' +
      'or weather satellite catalog. Groups: "stations", "starlink", "gps-ops", "weather", "science", ' +
      '"geo", "active". Returns up to 100 satellites with orbital parameters (inclination, eccentricity, period). ' +
      'Catalog/orbital data, not live tracking.',
    inputSchema: {
      type: 'object',
      properties: {
        group: {
          type: 'string',
          description: 'A CelesTrak group, e.g. "stations", "starlink", "gps-ops", "weather", "science", "geo", "active".',
        },
      },
      required: ['group'],
    },
  },
];

async function celestrakGet(query: string): Promise<unknown[] | { error: string; message: string }> {
  let res: Response;
  try {
    res = await fetch(`${BASE}?${query}&FORMAT=json`, { headers: { 'User-Agent': UA } });
  } catch (e) {
    return { error: 'not_found_or_error', message: e instanceof Error ? e.message : 'request failed' };
  }
  const body = await res.text();
  if (!res.ok) return { error: 'not_found_or_error', message: body.trim() || 'no data' };
  let data: unknown;
  try {
    data = JSON.parse(body);
  } catch {
    return { error: 'not_found_or_error', message: body.trim() || 'no data' };
  }
  if (!Array.isArray(data) || data.length === 0) {
    return { error: 'not_found_or_error', message: body.trim() || 'no data' };
  }
  return data;
}

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'get_satellite': {
      const norad = reqNum(args, 'norad_id', '25544 (ISS)');
      const data = await celestrakGet(`CATNR=${norad}`);
      if (!Array.isArray(data)) return data;
      return mapGp(data[0] as Gp);
    }
    case 'search_by_name': {
      const q = reqStr(args, 'name', '"STARLINK"');
      const data = await celestrakGet(`NAME=${encodeURIComponent(q)}`);
      if (!Array.isArray(data)) return data;
      return { count: data.length, satellites: data.slice(0, 50).map((o) => mapGp(o as Gp)) };
    }
    case 'get_group': {
      const group = reqStr(args, 'group', '"starlink"');
      const data = await celestrakGet(`GROUP=${encodeURIComponent(group)}`);
      if (!Array.isArray(data)) return data;
      return { group, count: data.length, satellites: data.slice(0, 100).map((o) => mapGp(o as Gp)) };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function reqStr(args: Record<string, unknown>, key: string, example: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.trim()) throw new Error(`Required argument "${key}" is missing. Pass a string like ${example}.`);
  return v;
}

function reqNum(args: Record<string, unknown>, key: string, example: string): number {
  const v = args[key];
  const n = typeof v === 'string' ? Number(v) : v;
  if (typeof n !== 'number' || !Number.isFinite(n)) throw new Error(`Required argument "${key}" is missing. Pass a number like ${example}.`);
  return n;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
