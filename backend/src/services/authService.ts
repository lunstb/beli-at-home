import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { GOOGLE_CLIENT_ID, JWT_SECRET } from '../config.js';
import { getDb } from '../database/connection.js';
import type { User } from '../types/index.js';

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

export interface GoogleUserInfo {
  sub: string;
  email: string;
  name: string;
  picture?: string;
}

export async function verifyGoogleToken(token: string): Promise<GoogleUserInfo> {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload) {
    throw new Error('Invalid Google token payload');
  }

  return {
    sub: payload.sub,
    email: payload.email || '',
    name: payload.name || '',
    picture: payload.picture,
  };
}

export function findOrCreateUser(googleUser: GoogleUserInfo): User {
  const db = getDb();

  let user = db.prepare('SELECT * FROM users WHERE google_id = ?').get(googleUser.sub) as User | undefined;

  if (!user) {
    const result = db.prepare(
      'INSERT INTO users (google_id, email, username, avatar_url) VALUES (?, ?, ?, ?)'
    ).run(googleUser.sub, googleUser.email, googleUser.name, googleUser.picture || null);

    user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid) as User;
  }

  return user;
}

export function generateJwt(user: User): string {
  return jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
}
