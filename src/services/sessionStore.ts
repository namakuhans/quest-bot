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

export interface PanelConfig {
  guildId?: string;
  channelId: string;
  messageId: string;
  lang: 'id' | 'en';
  updatedAt: string;
}

export interface AppConfig {
  serverConfig: {
    ownerId?: string;
    prefix?: string;
  };
  questCounters: {
    completedQuests: number;
    totalQuestsProcessed: number;
  };
  activePanels: PanelConfig[];
}

interface EncryptedData {
  iv: string;
  authTag: string;
  content: string;
}

const SESSIONS_FILE = path.join(process.cwd(), 'src', 'data', 'sessions.json');
const CONFIG_FILE = path.join(process.cwd(), 'src', 'data', 'config.json');

// In-memory counter for live in-progress quests (resets to 0 on restart)
let liveInProgressQuests = 0;

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

  // --- AppConfig API (config.json) ---
  public static getConfig(): AppConfig {
    const defaultConfig: AppConfig = {
      serverConfig: {
        ownerId: process.env.OWNER_ID || ''
      },
      questCounters: {
        completedQuests: 0,
        totalQuestsProcessed: 0
      },
      activePanels: []
    };

    this.ensureFileExists(CONFIG_FILE, defaultConfig);
    try {
      const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      return {
        serverConfig: {
          ownerId: parsed.serverConfig?.ownerId || process.env.OWNER_ID || '',
          prefix: parsed.serverConfig?.prefix
        },
        questCounters: {
          completedQuests: Number(parsed.questCounters?.completedQuests) || 0,
          totalQuestsProcessed: Number(parsed.questCounters?.totalQuestsProcessed) || 0
        },
        activePanels: Array.isArray(parsed.activePanels) ? parsed.activePanels : []
      };
    } catch (e) {
      return defaultConfig;
    }
  }

  public static saveConfig(config: AppConfig): void {
    const dir = path.dirname(CONFIG_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
  }

  // --- Sessions API (sessions.json) ---
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

  // --- Quest Counters API ---
  public static getStats() {
    const config = this.getConfig();
    return {
      completedQuests: config.questCounters.completedQuests,
      inProgressQuests: liveInProgressQuests,
      totalQuestsProcessed: config.questCounters.totalQuestsProcessed
    };
  }

  public static incrementCompletedQuests(count: number = 1): void {
    const config = this.getConfig();
    config.questCounters.completedQuests = (config.questCounters.completedQuests || 0) + count;
    liveInProgressQuests = Math.max(0, liveInProgressQuests - count);
    this.saveConfig(config);
  }

  public static incrementInProgressQuests(count: number = 1): void {
    liveInProgressQuests += count;
    const config = this.getConfig();
    config.questCounters.totalQuestsProcessed = (config.questCounters.totalQuestsProcessed || 0) + count;
    this.saveConfig(config);
  }

  public static decrementInProgressQuests(count: number = 1): void {
    liveInProgressQuests = Math.max(0, liveInProgressQuests - count);
  }
}
