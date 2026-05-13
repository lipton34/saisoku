export type AuthUser = {
  id: string;
  username: string;
  displayName: string | null;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
