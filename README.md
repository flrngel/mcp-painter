# Drawing MCP Server
[![smithery badge](https://smithery.ai/badge/@flrngel/mcp-painter)](https://smithery.ai/server/@flrngel/mcp-painter)

![Drawing MCP Server - A simple drawing tool for AI assistants](/cowboy.webp)
> Draw cowboy using canvas tools

A Model Context Protocol (MCP) server that provides drawing capabilities for AI assistants.

## Features

- Create a canvas with specified dimensions
- Draw filled rectangles with custom colors
- Export canvas as PNG image
- Get raw canvas data as JSON

## Installation

### Installing via Smithery

To install mcp-painter for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@flrngel/mcp-painter):

```bash
npx -y @smithery/cli install @flrngel/mcp-painter --client claude
```

### Manual Installation
Add this to your MCP config

```
    "painter": {
      "command": "npx",
      "args": ["-y", "github:flrngel/mcp-painter"]
    }
```
