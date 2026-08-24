import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { prisma } from '../db/prisma.js';



export const AUTH_COOKIE_NAME = 'village_auth_session';

export interface ActiveSession {
  email: string;
  role: string;
  name: string;
  createdAt: number;
}

export async function authenticateAdmin(email: string, pass: string): Promise<{ success: boolean; token?: string; user?: any; message?: string }> {
  // Query User table for authentication
  const user = await prisma.user.findFirst({
    where: {
      email: email.trim().toLowerCase(),
      password: pass,
    },
  });

  if (!user) {
    return { success: false, message: 'Invalid administrative email or password' };
  }

  const token = crypto.randomBytes(32).toString('hex');
  
  // Update token in User table
  await prisma.user.update({
    where: { id: user.id },
    data: { token: token },
  });

  const session: ActiveSession = {
    email: user.email,
    role: 'ADMINISTRATOR',
    name: user.email.split('@')[0], // Fallback name
    createdAt: Date.now(),
  };

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

export async function validateSessionToken(token: string | undefined): Promise<ActiveSession | null> {
  if (!token) return null;

  const user = await prisma.user.findFirst({
    where: { token: token },
  });

  if (!user) return null;
  
  // Note: We don't have a createdAt for token in DB, so we rely on token existence
  // If session expiration is needed, a tokenCreatedAt column should be added to the User table
  
  return {
    email: user.email,
    role: 'ADMINISTRATOR',
    name: user.email.split('@')[0],
    createdAt: Date.now(), // Fake it for compatibility if needed
  };
}

export async function logoutSessionToken(token: string | undefined): Promise<void> {
  if (token) {
    try {
      await prisma.user.updateMany({
        where: { token: token },
        data: { token: null },
      });
    } catch (e) {
      // Ignore errors during logout
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = req.cookies?.[AUTH_COOKIE_NAME] || req.headers.authorization?.replace(/^Bearer\s+/i, '');
  const session = await validateSessionToken(token);

  if (!session) {
    res.status(401).json({ error: 'Unauthorized: Valid administrative session required', isAuthenticated: false });
    return;
  }

  (req as any).userSession = session;
  next();
}
