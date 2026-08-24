import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@lakrakhurd.gov.pk';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'AdminPassword2026!';
const SESSION_SECRET = process.env.SESSION_SECRET || 'lakra_khurd_session_secret_key_2026';

export const AUTH_COOKIE_NAME = 'village_auth_session';

export interface ActiveSession {
  email: string;
  role: string;
  name: string;
  createdAt: number;
}

// In-memory token store mapped to active sessions
const activeTokens = new Map<string, ActiveSession>();

export function authenticateAdmin(email: string, pass: string): { success: boolean; token?: string; user?: any; message?: string } {
  if (email.trim().toLowerCase() !== ADMIN_EMAIL.toLowerCase() || pass !== ADMIN_PASSWORD) {
    return { success: false, message: 'Invalid administrative email or password' };
  }

  const token = crypto.randomBytes(32).toString('hex');
  const session: ActiveSession = {
    email: ADMIN_EMAIL,
    role: 'ADMINISTRATOR',
    name: 'Village Administrator',
    createdAt: Date.now(),
  };

  activeTokens.set(token, session);

  return {
    success: true,
    token,
    user: {
      email: session.email,
      name: session.name,
      role: session.role,
      isAuthenticated: true,
    },
  };
}

export function validateSessionToken(token: string | undefined): ActiveSession | null {
  if (!token) return null;
  const session = activeTokens.get(token);
  if (!session) return null;
  // Expire after 7 days
  if (Date.now() - session.createdAt > 7 * 24 * 60 * 60 * 1000) {
    activeTokens.delete(token);
    return null;
  }
  return session;
}

export function logoutSessionToken(token: string | undefined): void {
  if (token) {
    activeTokens.delete(token);
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.[AUTH_COOKIE_NAME] || req.headers.authorization?.replace(/^Bearer\s+/i, '');
  const session = validateSessionToken(token);

  if (!session) {
    res.status(401).json({ error: 'Unauthorized: Valid administrative session required', isAuthenticated: false });
    return;
  }

  (req as any).userSession = session;
  next();
}
