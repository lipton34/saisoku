import { LogOut, ScrollText, Sparkles, Swords } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">
            <Swords size={22} />
          </div>
          <div>
            <p className="eyebrow">GBF Utility</p>
            <h1>Saisoku</h1>
          </div>
        </div>

        <nav className="nav-list">
          <NavLink to="/" end>
            <Sparkles size={18} />
            ホーム
          </NavLink>
          <NavLink to="/tasks">
            <ScrollText size={18} />
            タスク
          </NavLink>
        </nav>

        <div className="sidebar-user">
          <span>{user?.displayName || user?.username}</span>
          <button className="icon-text-button" onClick={handleLogout} type="button">
            <LogOut size={16} />
            ログアウト
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
