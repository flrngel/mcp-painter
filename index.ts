#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  CallToolResult,
  TextContent,
  ImageContent, // Import ImageContent
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

// Import the drawing tool logic from drawingTool.ts (compiled to .js)
import * as drawingTool from './drawingTool.js'; // Adjust path if needed - assuming you compile drawingTool.ts to drawingTool.js in the same directory


// Define drawing tools - updated descriptions to reflect PNG output
const TOOLS = [
  {
    name: "drawing_generateCanvas",
    description: "Generate a new drawing canvas with specified width and height.",
    inputSchema: {
      type: "object",
      properties: {
        width: { type: "number", description: "Width of the canvas in pixels" },
        height: { type: "number", description: "Height of the canvas in pixels" },
      },
      required: ["width", "height"],
    },
  },
  {
    name: "drawing_fillRectangle",
    description: "Fill a rectangle on the drawing canvas with a specified color and coordinates.",
    inputSchema: {
      type: "object",
      properties: {
        x: { type: "number", description: "X coordinate of the top-left corner of the rectangle" },
        y: { type: "number", description: "Y coordinate of the top-left corner of the rectangle" },
        width: { type: "number", description: "Width of the rectangle" },
        height: { type: "number", description: "Height of the rectangle" },
        color: {
          type: "object",
          description: "Color to fill the rectangle with (RGB)",
          properties: {
            r: { type: "number", description: "Red component (0-255)" },
            g: { type: "number", description: "Green component (0-255)" },
            b: { type: "number", description: "Blue component (0-255)" },
            a: { type: "number", description: "Alpha component (0-255, optional, default 255)" },
          },
          required: ["r", "g", "b"],
        },
      },
      required: ["x", "y", "width", "height", "color"],
    },
  },
  {
    name: "drawing_getCanvasPng", // Changed name to reflect PNG output
    description: "Get the current drawing canvas as a PNG image (base64 encoded).", // Updated description
    inputSchema: {
      type: "object",
      properties: {}, // No input needed to get canvas data
      required: [],
    },
  },
  {
    name: "drawing_getCanvasData",
    description: "Get the current pixel data of the drawing canvas as JSON.",
    inputSchema: {
      type: "object",
      properties: {}, // No input needed to get canvas data
      required: [],
    },
  },
];

// Global state for drawing canvas
let currentCanvas: drawingTool.Canvas | null = null;

async function handleToolCall(name: string, args: any): Promise<CallToolResult> {

  switch (name) {
    // ... (your puppeteer tool cases from the example if you kept them) ...

    case "drawing_generateCanvas":
      try {
        currentCanvas = drawingTool.generateCanvas(args.width, args.height);
        return {
          content: [{
            type: "text",
            text: `Canvas generated with width: ${args.width}, height: ${args.height}`,
          }],
          isError: false,
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Failed to generate canvas: ${(error as Error).message}`,
          }],
          isError: true,
        };
      }

    case "drawing_fillRectangle":
      if (!currentCanvas) {
        return {
          content: [{
            type: "text",
            text: "Error: No canvas generated. Please use 'drawing_generateCanvas' first.",
          }],
          isError: true,
        };
      }
      try {
        drawingTool.fillRectangle(
          currentCanvas,
          args.x,
          args.y,
          args.width,
          args.height,
          args.color
        );
        return {
          content: [{
            type: "text",
            text: `Filled rectangle at (${args.x}, ${args.y}) with dimensions ${args.width}x${args.height} and color RGB(${args.color.r},${args.color.g},${args.color.b})`,
          }],
          isError: false,
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Failed to fill rectangle: ${(error as Error).message}`,
          }],
          isError: true,
        };
      }

    case "drawing_getCanvasPng": // Updated tool name
      if (!currentCanvas) {
        return {
          content: [{
            type: "text",
            text: "Error: No canvas generated. Please use 'drawing_generateCanvas' first.",
          }],
          isError: true,
        };
      }
      try {
        const base64Png = await drawingTool.getCanvasPngBase64(currentCanvas); // Use getCanvasPngBase64
        return {
          content: [
            {
              type: "text",
              text: "PNG image of the canvas (base64 encoded):", // Informative text
            },
            {
              type: "image", // Use 'image' content type
              data: base64Png,
              mimeType: "image/png",
            } as ImageContent,
          ],
          isError: false,
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Failed to get canvas PNG data: ${(error as Error).message}`,
          }],
          isError: true,
        };
      }
      case "drawing_getCanvasData":
        if (!currentCanvas) {
          return {
            content: [{
              type: "text",
              text: "Error: No canvas generated. Please use 'drawing_generateCanvas' first.",
            }],
            isError: true,
          };
        }
        try {
          const canvasData = drawingTool.getCanvasData(currentCanvas); // Use getCanvasData
          // Return canvas data as JSON text content
          return {
            content: [{
              type: "text",
              text: JSON.stringify(canvasData, null, 2), // Stringify for readable JSON
            }],
            isError: false,
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `Failed to get canvas data: ${(error as Error).message}`,
            }],
            isError: true,
          };
        }


    default:
      return {
        content: [{
          type: "text",
          text: `Unknown tool: ${name}`,
        }],
        isError: true,
      };
  }
}

const server = new Server(
  {
    name: "example-servers/drawing",
    version: "0.1.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  },
);


// Setup request handlers
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    // ... (your puppeteer resources if you kept them) ...
    {
      uri: "drawing://canvas_png", // Changed URI to reflect PNG output
      mimeType: "image/png", // Mime type for PNG image
      name: "Current Canvas as PNG Image", // Updated name
    },
    {
      uri: "drawing://canvas_data", // Example URI for canvas data
      mimeType: "application/json", // Indicate JSON format
      name: "Current Canvas Data (JSON)",
    },
  ],
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri.toString();

  if (uri === "drawing://canvas_png") { // Handle PNG resource
    if (!currentCanvas) {
      throw new Error("No canvas data available. Generate a canvas first.");
    }
    const base64Png = await drawingTool.getCanvasPngBase64(currentCanvas); // Use getCanvasPngBase64
    return {
      contents: [{
        uri,
        mimeType: "image/png",
        blob: base64Png, // Use 'blob' for base64 image data
      }],
    };
  }
  if (uri === "drawing://canvas_data") {
    if (!currentCanvas) {
      throw new Error("No canvas data available. Generate a canvas first.");
    }
    const canvasData = drawingTool.getCanvasData(currentCanvas);
    return {
      contents: [{
        uri,
        mimeType: "application/json",
        text: JSON.stringify(canvasData, null, 2),
      }],
    };
  }

  // ... (your puppeteer resource handling if you kept them) ...

  throw new Error(`Resource not found: ${uri}`);
});

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) =>
  handleToolCall(request.params.name, request.params.arguments ?? {})
);

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

runServer().catch(console.error);

process.stdin.on("close", () => {
  console.error("Drawing MCP Server closed");
  server.close();
});