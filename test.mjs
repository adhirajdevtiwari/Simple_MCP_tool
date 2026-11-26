// Smoke test for the MCP server in index.js.
//
// What it does:
//   1. Starts the server as a child process (node index.js).
//   2. Talks to it over stdio using JSON-RPC, the same way a real
//      MCP client (like Claude Desktop) would.
//   3. Checks that the server lists both tools and that the "add"
//      tool returns the right answer.
//
// Run it with:  npm test

import { spawn } from "node:child_process";
import readline from "node:readline";

const server = spawn("node", ["index.js"], { stdio: ["pipe", "pipe", "inherit"] });

// The server answers on stdout, one JSON message per line.
const rl = readline.createInterface({ input: server.stdout });
const pending = new Map(); // request id -> resolve function
rl.on("line", (line) => {
  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    return; // ignore any non-JSON noise
  }
  if (msg.id !== undefined && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  }
});

let nextId = 1;
function request(method, params = {}) {
  const id = nextId++;
  const call = new Promise((resolve, reject) => {
    pending.set(id, resolve);
    setTimeout(() => reject(new Error(`Timed out waiting for "${method}"`)), 5000);
  });
  server.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
  return call;
}

function check(label, condition) {
  if (!condition) {
    console.error(`FAIL: ${label}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${label}`);
  }
}

try {
  // 1. Handshake: every MCP session starts with "initialize".
  const init = await request("initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "smoke-test", version: "1.0.0" },
  });
  check("server responds to initialize", init.result?.serverInfo?.name === "example-server");

  // Tell the server we are ready, then ask for the tool list.
  server.stdin.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");
  const list = await request("tools/list");
  const toolNames = (list.result?.tools ?? []).map((t) => t.name).sort();
  check(
    "tools/list returns add and get_github_repos",
    JSON.stringify(toolNames) === JSON.stringify(["add", "get_github_repos"])
  );

  // 2. Call the "add" tool and check the math.
  const call = await request("tools/call", { name: "add", arguments: { a: 2, b: 3 } });
  check(
    'add(2, 3) returns "The sum of 2 and 3 is 5"',
    call.result?.content?.[0]?.text === "The sum of 2 and 3 is 5"
  );
} catch (err) {
  console.error(`FAIL: ${err.message}`);
  process.exitCode = 1;
} finally {
  server.kill();
}

if (process.exitCode === 1) {
  console.error("\nSmoke test failed.");
} else {
  console.log("\nAll checks passed.");
}
