import { Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { BuildsPage } from "./pages/BuildsPage";
import { GoalsPage } from "./pages/GoalsPage";
import { GuildWarGoalsPage } from "./pages/GuildWarGoalsPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { MaterialsPage } from "./pages/MaterialsPage";
import { OfficialNewsPage } from "./pages/OfficialNewsPage";
import { RoadmapPage } from "./pages/RoadmapPage";
import { TasksPage } from "./pages/TasksPage";
import { ToolPlaceholderPage } from "./pages/ToolPlaceholderPage";

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="/builds" element={<BuildsPage mode="search" />} />
          <Route path="/builds/search" element={<BuildsPage mode="search" />} />
          <Route path="/builds/post" element={<BuildsPage mode="form" />} />
          <Route path="/builds/:sourceType/:buildId" element={<BuildsPage />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/guild-war-goals" element={<GuildWarGoalsPage />} />
          <Route path="/materials" element={<MaterialsPage />} />
          <Route path="/official-news" element={<OfficialNewsPage />} />
          <Route path="/roadmap" element={<RoadmapPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/tools/:toolId" element={<ToolPlaceholderPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
