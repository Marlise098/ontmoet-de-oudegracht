import { Router, type IRouter } from "express";
import { GetPublicFilmAssetParams } from "@workspace/api-zod";
import { findPublicMedia, parseByteRange } from "../lib/public-media";

const router: IRouter = Router();

// Only these two approved display assets are public. No upload endpoint is exposed.
router.get("/storage/public-objects/:assetName", async (req, res): Promise<void> => {
  const params = GetPublicFilmAssetParams.safeParse(req.params);
  if (!params.success) {
    res.status(404).end();
    return;
  }
  try {
    const file = await findPublicMedia(params.data.assetName);
    if (!file) {
      res.status(404).end();
      return;
    }
    const [metadata] = await file.getMetadata();
    const size = Number(metadata.size);
    if (!Number.isSafeInteger(size) || size <= 0) throw new Error("Invalid media size");
    res.set({
      "Content-Type": params.data.assetName.endsWith(".mp4") ? "video/mp4" : "image/jpeg",
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    });
    const range = req.headers.range ? parseByteRange(req.headers.range, size) : undefined;
    if (range === null) {
      res.set("Content-Range", `bytes */${size}`).status(416).end();
      return;
    }
    const start = range?.start ?? 0;
    const end = range?.end ?? size - 1;
    res.status(range ? 206 : 200).set("Content-Length", String(end - start + 1));
    if (range) res.set("Content-Range", `bytes ${start}-${end}/${size}`);
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    const stream = file.createReadStream({ start, end });
    stream.on("error", () => {
      req.log.error("Public media stream failed");
      if (!res.headersSent) {
        res.removeHeader("Content-Length");
        res.removeHeader("Content-Range");
        res.status(503).end();
      } else res.destroy();
    });
    res.on("close", () => stream.destroy());
    stream.pipe(res);
  } catch {
    req.log.error("Public media storage unavailable");
    res.status(503).end();
  }
});

export default router;
