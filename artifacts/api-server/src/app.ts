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
      // Same-origin requests do not include an Origin header. Development
      // tooling may use a separate origin, so it remains permissive there.
      if (!origin || process.env.NODE_ENV !== "production") {
        callback(null, true);
        return;
      }
      callback(null, configuredCorsOrigins.includes(origin));
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
