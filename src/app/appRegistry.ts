import type { RouteObject } from "react-router-dom";

export type SubMenuItem = {
  key: string;
  label: string;
  path: string; // basePath 기준 상대 경로, e.g. "content"
};

export type AppDefinition = {
  key: string;
  label: string;
  icon: string;
  basePath: string;
  routes: RouteObject[];
  subMenu?: SubMenuItem[];
};

export const appRegistry: AppDefinition[] = [
];

export function getVisibleApps(allowedApps: string[] | undefined): AppDefinition[] {
  if (!allowedApps || allowedApps.length === 0) return appRegistry;
  return appRegistry.filter((app) => allowedApps.includes(app.key));
}
