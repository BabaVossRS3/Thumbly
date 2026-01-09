import { useState } from "react";
import { Users, CreditCard, BarChart3, LogOut } from "lucide-react";
import UsersPage from "../pages/Users";
import SubscriptionsPage from "../pages/Subscriptions";
import AnalyticsPage from "../pages/Analytics";

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  onLogout: () => void;
}

export default function Sidebar({ currentPage, onPageChange, onLogout }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent, tabId: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onPageChange(tabId);
    }
  };

  const tabs = [
    { id: "users", label: "Users", icon: Users },
    { id: "subscriptions", label: "Subscriptions", icon: CreditCard },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case "users":
        return <UsersPage />;
      case "subscriptions":
        return <SubscriptionsPage />;
      case "analytics":
        return <AnalyticsPage />;
      default:
        return <UsersPage />;
    }
  };

  return (
    <>
      <aside
        className={`fixed left-0 top-0 h-screen z-50 transition-all duration-300 ${
          isExpanded ? "w-64" : "w-20"
        }`}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        role="navigation"
        aria-label="Admin sidebar navigation"
      >
        <div className="h-full bg-black/40 backdrop-blur border-r border-white/10 flex flex-col">
          <div className="px-4 py-6 border-b border-white/10 flex items-center flex-col justify-center overflow-hidden">
            <img
              className="h-12 w-auto"
              src="/src/assets/logo.png"
              alt="logo"
            />
            
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Main navigation">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => onPageChange(tab.id)}
                  onKeyDown={(e) => handleKeyDown(e, tab.id)}
                  type="button"
                  aria-current={currentPage === tab.id ? "page" : undefined}
                  aria-label={tab.label}
                  title={tab.label}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                    currentPage === tab.id
                      ? "bg-pink-600 text-white"
                      : "text-white/80 hover:bg-white/10"
                  }`}
                >
                  <Icon size={20} className="shrink-0" aria-hidden="true" />
                  <span
                    className={`text-sm font-medium whitespace-nowrap transition-opacity duration-300 ${
                      isExpanded
                        ? "opacity-100"
                        : "opacity-0 w-0 overflow-hidden"
                    }`}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="px-3 py-4 border-t border-white/10">
            <button
              onClick={onLogout}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onLogout();
                }
              }}
              type="button"
              aria-label="Logout"
              title="Logout"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-red-400 hover:text-red-300 text-left focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <LogOut size={20} className="shrink-0" aria-hidden="true" />
              <span
                className={`text-sm font-medium whitespace-nowrap transition-opacity duration-300 ${
                  isExpanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
                }`}
              >
                Logout
              </span>
            </button>
          </div>
        </div>
      </aside>

      <main
        className={`absolute right-0 top-0 min-h-screen transition-all duration-300 ${
          isExpanded ? "left-64" : "left-20"
        }`}
      >
        {renderPage()}
      </main>
    </>
  );
}
