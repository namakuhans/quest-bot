import fs from 'fs';
import path from 'path';

export interface UserSession {
  userId: string;
  token: string;
  webhookUrl?: string;
  createdAt: string;
  lastRunAt?: string;
  lastStatus?: string;
}

const SESSIONS_FILE = path.join(process.cwd(), 'src', 'data', 'sessions.json');

export class SessionStorage {
  private static ensureFileExists() {
    const dir = path.dirname(SESSIONS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(SESSIONS_FILE)) {
      fs.writeFileSync(SESSIONS_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
  }

  public static getSessions(): UserSession[] {
    this.ensureFileExists();
    try {
      const data = fs.readFileSync(SESSIONS_FILE, 'utf-8');
      return JSON.parse(data) as UserSession[];
    } catch (e) {
      return [];
    }
  }

  public static saveSession(session: UserSession): void {
    const sessions = this.getSessions();
    const existingIndex = sessions.findIndex((s) => s.userId === session.userId);
    if (existingIndex >= 0) {
      sessions[existingIndex] = { ...sessions[existingIndex], ...session };
    } else {
      sessions.push(session);
    }
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2), 'utf-8');
  }

  public static removeSession(userId: string): void {
    const sessions = this.getSessions().filter((s) => s.userId !== userId);
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2), 'utf-8');
  }
}
