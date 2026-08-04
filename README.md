# mcp-celestrak

CelesTrak MCP — satellite orbital elements (TLE / GP data) for any tracked object.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `get_satellite` | Get satellite orbital elements (TLE / GP data) for a single object by NORAD catalog ID. Returns orbital parameters: inclination, eccentricity, mean motion, RAAN, argument of perigee, epoch, and derived orbital period in minutes. norad_id 25544 = ISS, 20580 = Hubble. This is the orbital catalog, not live position tracking. |
| `search_by_name` | Search the satellite catalog by name substring and return matching orbital elements (TLE / GP data). e.g. "STARLINK", "NOAA", "GPS". Returns up to 50 matches with orbital parameters (inclination, eccentricity, period). Catalog/orbital data, not live tracking. |
| `get_group` | List orbital elements (TLE / GP data) for an entire CelesTrak group — e.g. the Starlink, GPS, or weather satellite catalog. Groups: "stations", "starlink", "gps-ops", "weather", "science", "geo", "active". Returns up to 100 satellites with orbital parameters (inclination, eccentricity, period). Catalog/orbital data, not live tracking. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "celestrak": {
      "url": "https://gateway.pipeworx.io/celestrak/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Celestrak data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
