import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import path from "node:path";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();
app.set("trust proxy", process.env.NODE_ENV === "production" ? 1 : 0);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
const configuredCorsOrigins = (process.env.CORS_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);

app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      // Requests without an Origin header are same-origin or non-browser
      // callers and do not need CORS headers.
      if (!origin) {
        callback(null, true);
        return;
      }

      if (process.env.NODE_ENV !== "production") {
        callback(null, true);
        return;
      }

      // Railway serves the React app and API from the same public origin.
      // Same-origin requests do not need an Access-Control-Allow-Origin
      // header, so an unset allowlist is correct for the combined service.
      // Explicitly configured origins remain supported for a separately
      // hosted frontend or trusted API client.
      const publicAppOrigin = process.env.PUBLIC_APP_URL?.trim().replace(/\/+$/, "");
      const allowed =
        origin === publicAppOrigin ||
        configuredCorsOrigins.includes(origin);

      callback(null, allowed);
    },
  }),
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  logger.error({ err, method: req.method, url: req.url }, "Unhandled API error");
  res.status(500).json({ error: "Internal server error" });
});

if (process.env.NODE_ENV === "production") {
  const webRoot = path.resolve(__dirname, "../../starcash/dist/public");

  app.use(express.static(webRoot));
  app.get(/^(?!\/api(?:\/|$)).*/, (_req, res) => {
    res.sendFile(path.join(webRoot, "index.html"));
  });
}

export default app;
