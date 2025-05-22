import { Link } from "wouter";
import {
  LayoutDashboard,
  Download,
  RefreshCw,
  FileSearch,
  Upload,
  Clock,
  Settings,
  HelpCircle,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";

type SidebarProps = {
  currentPath: string;
};

export default function Sidebar({ currentPath }: SidebarProps) {
  const isActive = (path: string) => {
    if (path === "/" && currentPath === "/") return true;
    if (path !== "/" && currentPath.startsWith(path)) return true;
    return false;
  };

  // Navigation items organized by category
  const mainNavItems = [
    { path: "/", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { path: "/extract", label: "Extract", icon: <Download className="w-5 h-5" /> },
    { path: "/transform", label: "Transform", icon: <RefreshCw className="w-5 h-5" /> },
    { path: "/review", label: "Review", icon: <FileSearch className="w-5 h-5" /> },
    { path: "/deploy", label: "Deploy", icon: <Upload className="w-5 h-5" /> },
    { path: "/history", label: "History", icon: <Clock className="w-5 h-5" /> },
  ];

  const settingsNavItems = [
    { path: "/configuration", label: "Configuration", icon: <Settings className="w-5 h-5" /> },
    { path: "/help", label: "Help", icon: <HelpCircle className="w-5 h-5" /> },
  ];

  return (
    <aside className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 border-r border-neutral-200 bg-white">
        {/* Header */}
        <div className="flex items-center h-16 px-4 border-b border-neutral-200">
          <h1 className="text-xl font-medium text-primary">BC Migration Tool</h1>
        </div>
        
        {/* Main navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          <nav>
            <ul className="space-y-1 px-2">
              {mainNavItems.map((item) => (
                <li key={item.path}>
                  <Link href={item.path}>
                    <a className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      isActive(item.path) 
                        ? "bg-primary/10 text-primary" 
                        : "text-neutral-700 hover:bg-neutral-100"
                    )}>
                      {item.icon}
                      <span className="ml-3">{item.label}</span>
                    </a>
                  </Link>
                </li>
              ))}
            </ul>
          
            {/* Settings Navigation */}
            <div className="mt-8">
              <h3 className="px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Settings
              </h3>
              <ul className="mt-2 space-y-1 px-2">
                {settingsNavItems.map((item) => (
                  <li key={item.path}>
                    <Link href={item.path}>
                      <a className={cn(
                        "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                        isActive(item.path) 
                          ? "bg-primary/10 text-primary" 
                          : "text-neutral-700 hover:bg-neutral-100"
                      )}>
                        {item.icon}
                        <span className="ml-3">{item.label}</span>
                      </a>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </div>
        
        {/* Footer */}
        <div className="flex-shrink-0 flex border-t border-neutral-200 p-4">
          <div className="flex items-center">
            <div>
              <p className="text-sm font-medium text-neutral-700">Local Agent</p>
              <p className="text-xs text-neutral-500">v1.0.0</p>
            </div>
            <CheckCircle2 className="ml-auto h-4 w-4 text-green-500" />
          </div>
        </div>
      </div>
    </aside>
  );
}
