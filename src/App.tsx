import { Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ArchivePage } from "./pages/ArchivePage";
import { BuildDetailPage } from "./pages/BuildDetailPage";
import { BuildDraftsPage } from "./pages/BuildDraftsPage";
import { BuildEditorPage } from "./pages/BuildEditorPage";
import { BuildsPage } from "./pages/BuildsPage";
import { EventSchedulePage } from "./pages/EventSchedulePage";
import { GuildWarGoalsPage } from "./pages/GuildWarGoalsPage";
import { GoalEditorPage } from "./pages/GoalEditorPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { OfficialNewsPage } from "./pages/OfficialNewsPage";
import { ProgressGoalsPage } from "./pages/ProgressGoalsPage";
import { RoundGoalEditorPage } from "./pages/RoundGoalEditorPage";
import { RoundGoalsPage } from "./pages/RoundGoalsPage";

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="/goal-editor/:goalId" element={<GoalEditorPage />} />
          <Route path="/round-goals" element={<RoundGoalsPage />} />
          <Route path="/round-goals/new" element={<RoundGoalEditorPage />} />
          <Route path="/round-goals/:goalId/edit" element={<RoundGoalEditorPage />} />
          <Route path="/progress-goals" element={<ProgressGoalsPage />} />
          <Route path="/builds" element={<BuildsPage />} />
          <Route path="/builds/new" element={<BuildEditorPage mode="post" />} />
          <Route path="/builds/drafts" element={<BuildDraftsPage />} />
          <Route path="/builds/drafts/:draftId" element={<BuildEditorPage mode="draft" />} />
          <Route path="/builds/:buildId/edit" element={<BuildEditorPage mode="edit" />} />
          <Route path="/builds/:buildId" element={<BuildDetailPage />} />
          <Route path="/guild-war-goals" element={<GuildWarGoalsPage />} />
          <Route path="/archive" element={<ArchivePage />} />
          <Route path="/event-schedule" element={<EventSchedulePage />} />
          <Route path="/official-news" element={<OfficialNewsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
