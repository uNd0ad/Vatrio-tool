interface HeartbeatOptions {
  heartbeatUrl?: string;
  fetchImpl?: typeof fetch;
}

export async function pingHeartbeat(
  status: "success" | "fail",
  options: HeartbeatOptions = {}
): Promise<boolean> {
  const baseUrl = options.heartbeatUrl ?? process.env.CRAWLER_HEARTBEAT_URL;
  if (!baseUrl) return false;
  const url = status === "fail" ? `${baseUrl.replace(/\/$/, "")}/fail` : baseUrl;
  try {
    const response = await (options.fetchImpl ?? fetch)(url, {
      method: "GET",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      console.warn(`[Heartbeat] ${status} ping returned HTTP ${response.status}`);
      return false;
    }
    return true;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.warn(`[Heartbeat] ${status} ping failed: ${detail}`);
    return false;
  }
}
