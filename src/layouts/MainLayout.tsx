import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { appRegistry } from "@/nav/appRegistry";
import { clsx } from "@/shared/lib/clsx";

const COLLAPSED_WIDTH = "w-16";
const EXPANDED_WIDTH = "w-60";

function isAppActive(pathname: string, basePath: string): boolean {
  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}

export default function MainLayout() {
  const apps = appRegistry;
  const { pathname } = useLocation();
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setExpanded(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className={clsx(COLLAPSED_WIDTH, "shrink-0")} aria-hidden="true" />

      <aside
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        className={clsx(
          "fixed inset-y-0 left-0 z-40 flex flex-col overflow-hidden border-r border-slate-200 bg-white transition-all duration-200 ease-in-out",
          expanded ? `${EXPANDED_WIDTH} shadow-xl` : COLLAPSED_WIDTH
        )}
      >
        <div className="flex h-16 items-center overflow-hidden px-5">
          {expanded && (
            <span className="text-xl font-bold tracking-tight text-brand-dark whitespace-nowrap">Alsora-labs</span>
          )}
        </div>

        <nav className="flex-1 space-y-0.5 p-3">
          {apps.map((app) => {
            const isActiveApp = isAppActive(pathname, app.basePath);

            return (
              <div key={app.key} className="group rounded-lg">
                <NavLink
                  to={app.basePath}
                  className={({ isActive }) =>
                    clsx(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                      !expanded && "justify-center",
                      isActive ? "text-brand-dark" : "text-slate-600 hover:text-ink"
                    )
                  }
                >
                  <span className="text-base" aria-hidden="true">{app.icon}</span>
                  {expanded && app.label}
                </NavLink>

                {expanded && app.subMenu && (
                  <div
                    className={clsx(
                      "grid transition-all duration-200 ease-in-out",
                      isActiveApp ? "grid-rows-[1fr]" : "grid-rows-[0fr] group-hover:grid-rows-[1fr]"
                    )}
                  >
                    <div className="overflow-hidden">
                      <div className="space-y-0.5 px-2 pb-2 pt-1">
                        {app.subMenu.map((sub) => (
                          <NavLink
                            key={sub.key}
                            to={`${app.basePath}/${sub.path}`}
                            className={({ isActive }) =>
                              clsx(
                                "block rounded-md px-3 py-1.5 text-sm whitespace-nowrap transition-colors",
                                isActive
                                  ? "bg-brand/15 font-medium text-brand-dark"
                                  : "text-slate-500 hover:bg-brand/15 hover:text-ink"
                              )
                            }
                          >
                            {sub.label}
                          </NavLink>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
