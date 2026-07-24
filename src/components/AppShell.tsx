import { Archive, ChartNoAxesColumnIncreasing, Flame, Home, LogOut, Repeat2, Swords } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const navigation = [
  { to: "/round-goals", label: "周回目標", icon: Repeat2 },
  { to: "/progress-goals", label: "進捗管理", icon: ChartNoAxesColumnIncreasing },
  { to: "/builds", label: "編成", icon: Swords },
  { to: "/guild-war-goals", label: "古戦場", icon: Flame },
  { to: "/archive", label: "保管庫", icon: Archive }
];

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [headerHidden, setHeaderHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    function handleScroll() {
      const current = window.scrollY;
      setHeaderHidden(current > 72 && current > lastScrollY.current);
      lastScrollY.current = current;
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  function archiveActive() {
    return ["/archive", "/event-schedule", "/official-news"].some((path) => location.pathname.startsWith(path));
  }

  return (
    <div className="mobile-shell">
      <header className={headerHidden ? "app-header is-hidden" : "app-header"}>
        <NavLink aria-label="ホームへ戻る" className="app-header-home" to="/" end>
          <Home size={20} />
          <span>ホーム</span>
        </NavLink>
        <span className="app-header-user">{user?.displayName || user?.username}</span>
        <button aria-label="ログアウト" className="icon-button" onClick={handleLogout} title="ログアウト" type="button">
          <LogOut size={19} />
        </button>
      </header>

      <main className="main-content">
        <Outlet />
      </main>

      <nav aria-label="主な機能" className="bottom-navigation">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              className={({ isActive }) =>
                isActive || (item.to === "/archive" && archiveActive()) ? "active" : undefined
              }
              key={item.to}
              to={item.to}
            >
              <Icon aria-hidden="true" size={20} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
