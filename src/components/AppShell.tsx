import { Archive, ChartNoAxesColumnIncreasing, Flame, Home, ListTodo, LogOut, Repeat2, Swords } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const navigation = [
  { to: "/", label: "タスク", icon: ListTodo },
  { to: "/round-goals", label: "周回目標", icon: Repeat2 },
  { to: "/progress-goals", label: "進捗管理", icon: ChartNoAxesColumnIncreasing },
  { to: "/builds", label: "編成", icon: Swords },
  { to: "/guild-war-goals", label: "古戦場", icon: Flame }
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

  return (
    <div className="mobile-shell">
      <header className={headerHidden ? "app-header is-hidden" : "app-header"}>
        <NavLink aria-label="ホームへ戻る" className="app-header-home" to="/" end>
          <Home size={20} />
          <span>ホーム</span>
        </NavLink>
        <NavLink
          aria-label="保管庫"
          className={`icon-button app-header-archive${["/archive", "/event-schedule", "/official-news"].some((path) => location.pathname.startsWith(path)) ? " active" : ""}`}
          title="保管庫"
          to="/archive"
        >
          <Archive size={19} />
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
              className={({ isActive }) => isActive ? "active" : undefined}
              end={item.to === "/"}
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
