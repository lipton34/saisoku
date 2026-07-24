import { FormEvent, useState } from "react";
import { Navigate } from "react-router-dom";
import { ShieldCheck, Swords } from "lucide-react";
import { useAuth } from "../components/AuthContext";

export function LoginPage() {
  const { user, login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (mode === "login") {
        await login(username, password);
      } else {
        await register(username, password, displayName, inviteCode);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "ログイン処理に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="login-copy">
          <div className="brand-mark large">
            <Swords size={28} />
          </div>
          <p className="eyebrow">Crew Utility Hub</p>
          <h1>Saisoku</h1>
          <p>日課、週課、イベント準備をひとつの場所で確認する身内向け攻略サポート。</p>
          <div className="login-feature">
            <ShieldCheck size={18} />
            ユーザーごとにタスクを分けて保存します。
          </div>
        </div>

        <form className="auth-card" onSubmit={handleSubmit}>
          <div className="segmented">
            <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")} type="button">
              ログイン
            </button>
            <button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")} type="button">
              新規登録
            </button>
          </div>

          <label>
            ユーザー名
            <input autoComplete="username" onChange={(event) => setUsername(event.target.value)} value={username} />
          </label>

          {mode === "register" && (
            <>
              <label>
                表示名
                <input onChange={(event) => setDisplayName(event.target.value)} value={displayName} />
              </label>
              <label>
                招待コード
                <input autoComplete="off" onChange={(event) => setInviteCode(event.target.value)} value={inviteCode} />
              </label>
            </>
          )}

          <label>
            パスワード
            <input
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              value={password}
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <button className="primary-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? "処理中..." : mode === "login" ? "ログイン" : "登録して開始"}
          </button>
        </form>
      </section>
    </main>
  );
}
