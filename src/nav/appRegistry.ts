import type { RouteObject } from "react-router-dom";
import {knockRoutes} from "@/apps/knock/routes.tsx";

export type SubMenuItem = {
  key: string;
  label: string;
  path: string; // basePath 기준 상대 경로
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
  {
    key: "knock knock",
    label: "knock knock",
    icon: "🃏",
    basePath: "/knock-knock",
    routes: knockRoutes,
    subMenu: [
      { key: "question", label: "질문 관리", path: "question" },
    ]
  }
];

export function getVisibleApps(allowedApps: string[] | undefined): AppDefinition[] {
  if (!allowedApps || allowedApps.length === 0) return appRegistry;
  return appRegistry.filter((app) => allowedApps.includes(app.key));
}
