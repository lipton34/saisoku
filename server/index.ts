import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { attachUser } from "./middleware/requireAuth.js";
import { authRouter } from "./routes/auth.js";
import { materialGoalsRouter } from "./routes/materialGoals.js";
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
app.use("/api/material-goals", materialGoalsRouter);
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
