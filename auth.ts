// server/src/auth.ts
// Cybersecurity teammate's file
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_in_env';
const TOKEN_EXPIRY = '15m'; // short-lived tokens

export type Role = 'student' | 'instructor' | 'admin';

export interface AuthPayload {
  userId: string;
  role: Role;
  sessionId?: string;
}

// ===== ISSUE TOKEN =====
export function issueToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

// ===== VERIFY MIDDLEWARE =====
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers['authorization'];
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed token' });
  }
  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
    (req as any).user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ===== RBAC MIDDLEWARE =====
export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as AuthPayload;
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ error: `Requires role: ${roles.join(' or ')}` });
    }
    next();
  };
}

// ===== LOGIN ROUTE (attach to Express app) =====
export function loginHandler(req: Request, res: Response) {
  const { username, password } = req.body;
  // TODO: replace with real DB lookup + bcrypt check
  const mockUsers: Record<string, { password: string; role: Role }> = {
    'student1': { password: 'pass123', role: 'student' },
    'instructor1': { password: 'teach123', role: 'instructor' },
  };
  const user = mockUsers[username];
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = issueToken({ userId: username, role: user.role });
  res.json({ token, role: user.role, expiresIn: TOKEN_EXPIRY });
}

// ===== USAGE IN server.ts =====
// import express from 'express';
// import { requireAuth, requireRole, loginHandler } from './auth';
//
// app.post('/api/login', loginHandler);
// app.post('/api/recording/start', requireAuth, requireRole('student','instructor'), startRecording);
// app.get('/api/recordings',        requireAuth, requireRole('instructor'),          getAllRecordings);
