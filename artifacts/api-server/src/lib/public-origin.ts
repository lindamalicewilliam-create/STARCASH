import type { Request } from "express";

export function getPublicOrigin(req: Request): string {
  const configuredOrigin = process.env.PUBLIC_APP_URL?.trim().replace(/\/+$/, "");
  if (configuredOrigin) {
    return configuredOrigin;
  }

  const forwardedProtocol = req.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const forwardedHost = req.get("x-forwarded-host")?.split(",")[0]?.trim();
  const protocol = forwardedProtocol || req.protocol;
  const host = forwardedHost || req.get("host");

  return `${protocol}://${host}`;
}