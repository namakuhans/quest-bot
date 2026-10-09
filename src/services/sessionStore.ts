import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface UserSession {
  userId: string;
  token: string;
  webhookUrl?: string;
  createdAt: string;
  lastRunAt?: string;
  lastStatus?: string;
}

export interface QuestStats {
  completedQuests: number;
  inProgressQuests: number;
  totalQuestsProcessed: number;
}

interface EncryptedData {
  iv: string;
  authTag: string;
  content: string;
}

const SESSIONS_FILE = path.join(process.cwd(), 'src', 'data', 'sessions.json');
const STATS_FILE = path.join(process.cwd(), 'src', 'data', 'stats.json');

const ENCRYPTION_KEY = process.env.ENCRYPTION_SECRET
  ? crypto.createHash('sha256').update(process.env.ENCRYPTION_SECRET).digest()
  : crypto.createHash('sha256').update('discord-auto-quest-secure-key-default').digest();

function encrypt(text: string): EncryptedData {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return {
    iv: iv.toString('hex'),
    authTag,
    content: encrypted
  };
}

function decrypt(encrypted: EncryptedData): string {
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    ENCRYPTION_KEY,
    Buffer.from(encrypted.iv, 'hex')
  );
  decipher.setAuthTag(Buffer.from(encrypted.authTag, 'hex'));
  let decrypted = decipher.update(encrypted.content, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export class SessionStorage {
  private static ensureFileExists(filepath: string, defaultContent: any) {
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(filepath)) {
      fs.writeFileSync(filepath, JSON.stringify(defaultContent, null, 2), 'utf-8');
    }
  }

  public static getSessions(): UserSession[] {
    this.ensureFileExists(SESSIONS_FILE, []);
    try {
      const data = fs.readFileSync(SESSIONS_FILE, 'utf-8');
      const encryptedSessions = JSON.parse(data) as any[];
      return encryptedSessions.map((item) => {
        if (item.encryptedToken) {
          const decryptedToken = decrypt(item.encryptedToken);
          return {
            userId: item.userId,
            token: decryptedToken,
            webhookUrl: item.webhookUrl,
            createdAt: item.createdAt,
            lastRunAt: item.lastRunAt,
            lastStatus: item.lastStatus
          };
        }
        return item;
      });
    } catch (e) {
      return [];
    }
  }

  public static saveSession(session: UserSession): void {
    const currentSessions = this.getSessions();
    const existingIndex = currentSessions.findIndex((s) => s.userId === session.userId);

    if (existingIndex >= 0) {
      currentSessions[existingIndex] = { ...currentSessions[existingIndex], ...session };
    } else {
      currentSessions.push(session);
    }

    const encryptedPayload = currentSessions.map((s) => ({
      userId: s.userId,
      encryptedToken: encrypt(s.token),
      webhookUrl: s.webhookUrl,
      createdAt: s.createdAt,
      lastRunAt: s.lastRunAt,
      lastStatus: s.lastStatus
    }));

    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(encryptedPayload, null, 2), 'utf-8');
  }

  public static removeSession(userId: string): void {
    const currentSessions = this.getSessions().filter((s) => s.userId !== userId);
    const encryptedPayload = currentSessions.map((s) => ({
      userId: s.userId,
      encryptedToken: encrypt(s.token),
      webhookUrl: s.webhookUrl,
      createdAt: s.createdAt,
      lastRunAt: s.lastRunAt,
      lastStatus: s.lastStatus
    }));

    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(encryptedPayload, null, 2), 'utf-8');
  }

  // --- Persistent Stats API ---
  public static getStats(): QuestStats {
    this.ensureFileExists(STATS_FILE, { completedQuests: 0, inProgressQuests: 0, totalQuestsProcessed: 0 });
    try {
      const data = fs.readFileSync(STATS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      return {
        completedQuests: Number(parsed.completedQuests) || 0,
        inProgressQuests: Number(parsed.inProgressQuests) || 0,
        totalQuestsProcessed: Number(parsed.totalQuestsProcessed) || 0
      };
    } catch (e) {
      return { completedQuests: 0, inProgressQuests: 0, totalQuestsProcessed: 0 };
    }
  }

  public static incrementCompletedQuests(count: number = 1): void {
    const stats = this.getStats();
    stats.completedQuests = (stats.completedQuests || 0) + count;
    stats.inProgressQuests = Math.max(0, (stats.inProgressQuests || 0) - count);
    fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2), 'utf-8');
  }

  public static incrementInProgressQuests(count: number = 1): void {
    const stats = this.getStats();
    stats.inProgressQuests = (stats.inProgressQuests || 0) + count;
    stats.totalQuestsProcessed = (stats.totalQuestsProcessed || 0) + count;
    fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2), 'utf-8');
  }

  public static decrementInProgressQuests(count: number = 1): void {
    const stats = this.getStats();
    stats.inProgressQuests = Math.max(0, (stats.inProgressQuests || 0) - count);
    fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2), 'utf-8');
  }
}
