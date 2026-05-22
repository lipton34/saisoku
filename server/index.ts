import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { attachUser } from "./middleware/requireAuth.js";
import { authRouter } from "./routes/auth.js";
import { buildMastersRouter } from "./routes/buildMasters.js";
import { buildsRouter } from "./routes/builds.js";
import { eventOccurrencesRouter } from "./routes/eventOccurrences.js";
import { eventNotesRouter } from "./routes/eventNotes.js";
import { eventSeriesRouter } from "./routes/eventSeries.js";
import { guildWarGoalsRouter } from "./routes/guildWarGoals.js";
import { materialGoalsRouter } from "./routes/materialGoals.js";
import {
  newsFetchLogsRouter,
  newsItemsRouter,
  officialNewsRouter,
  sourceArticlesRouter
} from "./routes/officialNews.js";
import { sharedGoalsRouter } from "./routes/sharedGoals.js";
import { tasksRouter } from "./routes/tasks.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT ?? 4000);
const clientOrigin = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";
const isProduction = process.env.NODE_ENV === "production";

app.use(
  cors({
    origin: isProduction ? true : clientOrigin,
    credentials: true
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(attachUser);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRouter);
app.use("/api/build-masters", buildMastersRouter);
app.use("/api/builds", buildsRouter);
app.use("/api/event-notes", eventNotesRouter);
app.use("/api/event-occurrences", eventOccurrencesRouter);
app.use("/api/event-series", eventSeriesRouter);
app.use("/api/guild-war-goals", guildWarGoalsRouter);
app.use("/api/material-goals", materialGoalsRouter);
app.use("/api/news", officialNewsRouter);
app.use("/api/news-fetch-logs", newsFetchLogsRouter);
app.use("/api/news-items", newsItemsRouter);
app.use("/api/source-articles", sourceArticlesRouter);
app.use("/api/shared-goals", sharedGoalsRouter);
app.use("/api/tasks", tasksRouter);

if (isProduction) {
  const clientDistPath = path.resolve(__dirname, "../dist");
  app.use(express.static(clientDistPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientDistPath, "index.html"));
  });
}

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  res.status(500).json({ message: "サーバーでエラーが発生しました" });
});

app.listen(port, () => {
  console.log(`Saisoku API listening on http://localhost:${port}`);
});
