import { spawn } from "node:child_process";

const node = process.execPath;
const children = [
  spawn(node, ["--disable-warning=ExperimentalWarning", "server/index.ts"], {
    stdio: "inherit",
  }),
  spawn(node, ["node_modules/vite/bin/vite.js", "--config", "client/vite.config.ts"], {
    stdio: "inherit",
  }),
];

function stop() {
  for (const child of children) child.kill("SIGTERM");
}

process.on("SIGINT", stop);
process.on("SIGTERM", stop);

for (const child of children) {
  child.on("exit", (code) => {
    if (code && code !== 0) {
      stop();
      process.exit(code);
    }
  });
}
