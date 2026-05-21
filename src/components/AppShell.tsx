import {
  Boxes,
  FilePlus2,
  Flag,
  Flame,
  LogOut,
  Map,
  Newspaper,
  PanelLeftClose,
  PanelLeftOpen,
  ScrollText,
  Sparkles,
  Swords
} from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className={isSidebarCollapsed ? "app-shell sidebar-collapsed" : "app-shell"}>
      <aside className="sidebar">
        <div className="sidebar-header">
          <NavLink aria-label="ホームへ戻る" className="brand-block" to="/" end>
            <div className="brand-mark">
              <Swords size={22} />
            </div>
            <div className="sidebar-label">
              <p className="eyebrow">GBF Utility</p>
              <h1>Saisoku</h1>
            </div>
          </NavLink>

          <button
            aria-label={isSidebarCollapsed ? "メニューを開く" : "メニューを折り畳む"}
            className="icon-button sidebar-toggle"
            onClick={() => setIsSidebarCollapsed((current) => !current)}
            title={isSidebarCollapsed ? "メニューを開く" : "メニューを折り畳む"}
            type="button"
          >
            {isSidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        <nav className="nav-list">
          <NavLink to="/" end>
            <Sparkles size={18} />
            <span className="sidebar-label">ホーム</span>
          </NavLink>
          <NavLink to="/tasks">
            <ScrollText size={18} />
            <span className="sidebar-label">タスク</span>
          </NavLink>
          <NavLink to="/materials">
            <Boxes size={18} />
            <span className="sidebar-label">素材メモ</span>
          </NavLink>
          <NavLink to="/goals">
            <Flag size={18} />
            <span className="sidebar-label">目標共有</span>
          </NavLink>
          <NavLink to="/guild-war-goals">
            <Flame size={18} />
            <span className="sidebar-label">古戦場計算</span>
          </NavLink>
          <NavLink to="/official-news">
            <Newspaper size={18} />
            <span className="sidebar-label">公式NEWS</span>
          </NavLink>
          <NavLink to="/builds/search">
            <Swords size={18} />
            <span className="sidebar-label">編成一覧・検索</span>
          </NavLink>
          <NavLink to="/builds/post">
            <FilePlus2 size={18} />
            <span className="sidebar-label">編成投稿</span>
          </NavLink>
          <NavLink to="/roadmap">
            <Map size={18} />
            <span className="sidebar-label">ロードマップ</span>
          </NavLink>
        </nav>

        <div className="sidebar-user">
          <span className="sidebar-label">{user?.displayName || user?.username}</span>
          <button className="icon-text-button" onClick={handleLogout} type="button">
            <LogOut size={16} />
            <span className="sidebar-label">ログアウト</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
