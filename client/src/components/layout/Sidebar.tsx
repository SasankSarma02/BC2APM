import { Link } from "wouter";

type SidebarProps = {
  currentPath: string;
};

export default function Sidebar({ currentPath }: SidebarProps) {
  const isActive = (path: string) => {
    if (path === "/" && currentPath === "/") return true;
    if (path !== "/" && currentPath.startsWith(path)) return true;
    return false;
  };

  return (
    <aside className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 border-r border-neutral-200 bg-white">
        <div className="flex items-center h-16 px-4 border-b border-neutral-200">
          <h1 className="text-xl font-medium text-primary">BC Migration Tool</h1>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            <li>
              <Link href="/">
                <a className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${isActive("/") ? "sidebar-active text-primary" : "text-neutral-700 hover:bg-neutral-100"}`}>
                  <span className={`material-icons mr-3 ${isActive("/") ? "text-primary" : "text-neutral-500"}`}>dashboard</span>
                  Dashboard
                </a>
              </Link>
            </li>
            <li>
              <Link href="/extract">
                <a className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${isActive("/extract") ? "sidebar-active text-primary" : "text-neutral-700 hover:bg-neutral-100"}`}>
                  <span className={`material-icons mr-3 ${isActive("/extract") ? "text-primary" : "text-neutral-500"}`}>download</span>
                  Extract
                </a>
              </Link>
            </li>
            <li>
              <Link href="/transform">
                <a className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${isActive("/transform") ? "sidebar-active text-primary" : "text-neutral-700 hover:bg-neutral-100"}`}>
                  <span className={`material-icons mr-3 ${isActive("/transform") ? "text-primary" : "text-neutral-500"}`}>sync_alt</span>
                  Transform
                </a>
              </Link>
            </li>
            <li>
              <Link href="/review">
                <a className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${isActive("/review") ? "sidebar-active text-primary" : "text-neutral-700 hover:bg-neutral-100"}`}>
                  <span className={`material-icons mr-3 ${isActive("/review") ? "text-primary" : "text-neutral-500"}`}>compare</span>
                  Review
                </a>
              </Link>
            </li>
            <li>
              <Link href="/deploy">
                <a className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${isActive("/deploy") ? "sidebar-active text-primary" : "text-neutral-700 hover:bg-neutral-100"}`}>
                  <span className={`material-icons mr-3 ${isActive("/deploy") ? "text-primary" : "text-neutral-500"}`}>cloud_upload</span>
                  Deploy
                </a>
              </Link>
            </li>
            <li>
              <Link href="/history">
                <a className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${isActive("/history") ? "sidebar-active text-primary" : "text-neutral-700 hover:bg-neutral-100"}`}>
                  <span className={`material-icons mr-3 ${isActive("/history") ? "text-primary" : "text-neutral-500"}`}>history</span>
                  History
                </a>
              </Link>
            </li>
          </ul>
          <div className="mt-8">
            <h3 className="px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Settings
            </h3>
            <ul className="mt-2 space-y-1 px-2">
              <li>
                <Link href="/configuration">
                  <a className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${isActive("/configuration") ? "sidebar-active text-primary" : "text-neutral-700 hover:bg-neutral-100"}`}>
                    <span className={`material-icons mr-3 ${isActive("/configuration") ? "text-primary" : "text-neutral-500"}`}>settings</span>
                    Configuration
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/help">
                  <a className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${isActive("/help") ? "sidebar-active text-primary" : "text-neutral-700 hover:bg-neutral-100"}`}>
                    <span className={`material-icons mr-3 ${isActive("/help") ? "text-primary" : "text-neutral-500"}`}>help</span>
                    Help
                  </a>
                </Link>
              </li>
            </ul>
          </div>
        </nav>
        <div className="flex-shrink-0 flex border-t border-neutral-200 p-4">
          <div className="flex items-center">
            <div className="ml-3">
              <p className="text-sm font-medium text-neutral-700">Local Agent</p>
              <p className="text-xs text-neutral-500">v1.0.0</p>
            </div>
            <span className="ml-auto h-3 w-3 rounded-full bg-success"></span>
          </div>
        </div>
      </div>
    </aside>
  );
}
