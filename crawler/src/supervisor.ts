import { spawn, type ChildProcess } from "node:child_process";
import { pathToFileURL } from "node:url";

export function restartDelay(attempt: number, baseDelayMs = 1000, maxDelayMs = 30_000): number {
  if (!Number.isInteger(attempt) || attempt < 1) throw new RangeError("attempt must be a positive integer");
  return Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs);
}

export async function superviseCrawler(): Promise<number> {
  const maxRestarts = Number(process.env.CRAWLER_MAX_RESTARTS ?? 5);
  if (!Number.isInteger(maxRestarts) || maxRestarts < 0) throw new RangeError("CRAWLER_MAX_RESTARTS must be non-negative");
  let child: ChildProcess | null = null;
  const forwardSigint = () => child?.kill("SIGINT");
  const forwardSigterm = () => child?.kill("SIGTERM");
  process.on("SIGINT", forwardSigint);
  process.on("SIGTERM", forwardSigterm);
  try {
    for (let attempt = 0; attempt <= maxRestarts; attempt += 1) {
      const exitCode = await new Promise<number>((resolve, reject) => {
        child = spawn(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "start"], { stdio: "inherit" });
        child.once("error", reject);
        child.once("exit", (code, signal) => resolve(signal ? 1 : (code ?? 1)));
      });
      if (exitCode === 0) return 0;
      if (attempt === maxRestarts) return exitCode;
      const delay = restartDelay(attempt + 1);
      console.warn(`[Supervisor] Crawler exited with ${exitCode}; restart ${attempt + 1}/${maxRestarts} in ${delay}ms.`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    return 1;
  } finally {
    process.off("SIGINT", forwardSigint);
    process.off("SIGTERM", forwardSigterm);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void superviseCrawler().then((code) => { process.exitCode = code; });
}
