import { Navigate, createBrowserRouter, RouterProvider } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";
import { appRegistry } from "./appRegistry";

const firstApp = appRegistry[0];

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <Navigate to={firstApp.basePath} replace /> },
      // appRegistry에 등록된 앱마다 basePath 하위에 라우트를 자동으로 마운트합니다.
      ...appRegistry.map((app) => ({
        path: app.basePath.replace(/^\//, ""),
        children: app.routes,
      })),
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
