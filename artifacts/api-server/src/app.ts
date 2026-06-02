import express, { type Express, type Request, type Response } from "express";
import http from "node:http";
import cors from "cors";
import { logger } from "./lib/logger";

const DJANGO_HOST = "127.0.0.1";
const DJANGO_PORT = 5000;

const app: Express = express();

app.use(cors({ origin: true, credentials: true }));

app.use((req: Request, res: Response) => {
  const options: http.RequestOptions = {
    hostname: DJANGO_HOST,
    port: DJANGO_PORT,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: `${DJANGO_HOST}:${DJANGO_PORT}`,
      "x-forwarded-for": req.ip || "",
      "x-forwarded-proto": "https",
    },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.status(proxyRes.statusCode ?? 502);

    for (const [key, value] of Object.entries(proxyRes.headers)) {
      if (value !== undefined) {
        res.setHeader(key, value);
      }
    }

    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on("error", (err) => {
    logger.error({ err }, "Django proxy error");
    if (!res.headersSent) {
      res.status(502).json({
        error: "Backend unavailable",
        detail: "Could not reach Django API server",
      });
    }
  });

  req.pipe(proxyReq, { end: true });
});

export default app;
