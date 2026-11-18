import { Storage } from "@google-cloud/storage";

// Replit sidecar authentication; no credentials are sent to the browser.
const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

export const objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: { type: "json", subject_token_field_name: "access_token" },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

export async function findPublicMedia(assetName: string) {
  const paths = (process.env.PUBLIC_OBJECT_SEARCH_PATHS ?? "")
    .split(",").map((path) => path.trim()).filter(Boolean);
  if (!paths.length) throw new Error("Public media storage is not configured");
  for (const path of paths) {
    const [bucketName, ...prefix] = path.replace(/^\/+/, "").split("/");
    if (!bucketName) continue;
    const file = objectStorageClient.bucket(bucketName)
      .file([...prefix.filter(Boolean), assetName].join("/"));
    const [exists] = await file.exists();
    if (exists) return file;
  }
  return null;
}

/** A single HTTP byte range, including open-ended and suffix ranges. */
export function parseByteRange(header: string, size: number) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header);
  if (!match || (!match[1] && !match[2])) return null;
  if (!match[1]) {
    const suffix = Number(match[2]);
    if (!Number.isSafeInteger(suffix) || suffix <= 0) return null;
    return { start: Math.max(0, size - suffix), end: size - 1 };
  }
  const start = Number(match[1]);
  const end = match[2] ? Number(match[2]) : size - 1;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end)
    || start >= size || end < start) return null;
  return { start, end: Math.min(end, size - 1) };
}
