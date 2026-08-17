import { setAuthTokenGetter } from "@workspace/api-client-react";

export const getToken = () => localStorage.getItem("starcash_token");
export const setToken = (token: string) => localStorage.setItem("starcash_token", token);
export const removeToken = () => localStorage.removeItem("starcash_token");

setAuthTokenGetter(() => getToken());

export function appPath(path: string): string {
  const base = import.meta.env.BASE_URL || "/";
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}
