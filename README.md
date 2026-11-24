# Simple MCP Tool

A small [Model Context Protocol](https://modelcontextprotocol.io) (MCP) server written in Node.js. It runs over stdio, so an MCP client such as Claude Desktop can start it and call its tools.

## Tools

| Tool | Input | What it does |
| --- | --- | --- |
| `add` | `a` (number), `b` (number) | Returns the sum of the two numbers. |
| `get_github_repos` | `username` (string) | Calls the GitHub API (`/users/{username}/repos`) and returns a numbered list of that user's public repo names. |

## Setup

Needs Node.js 18 or newer.

```bash
npm install
npm start
```

The server waits for an MCP client on stdin/stdout, so it prints nothing when started by hand.

## Use it from an MCP client

Add it to the client's config, with the path to this folder:

```json
{
  "mcpServers": {
    "simple-mcp-tool": {
      "command": "node",
      "args": ["/absolute/path/to/Simple_MCP_tool/index.js"]
    }
  }
}
```

## Built with

- [@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk)
- [zod](https://zod.dev) for input validation
- [axios](https://axios-http.com) for the GitHub request

## Notes

`get_github_repos` calls GitHub without a token, so it is limited to GitHub's unauthenticated rate limit and shows only the first page of repos.
