import fs from 'fs';
import path from 'path';
import { Client, REST, Routes, InteractionResponseType } from 'discord.js';
import { getSetContainer } from '../commands/set.js';

export interface PanelReference {
  channelId: string;
  messageId: string;
  lang: 'id' | 'en';
  updatedAt: string;
}

const PANELS_FILE = path.join(process.cwd(), 'src', 'data', 'panels.json');

export class PanelManager {
  private static globalClient: Client | null = null;

  public static setClient(client: Client) {
    this.globalClient = client;
  }

  private static ensureFileExists() {
    const dir = path.dirname(PANELS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(PANELS_FILE)) {
      fs.writeFileSync(PANELS_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
  }

  public static getPanels(): PanelReference[] {
    this.ensureFileExists();
    try {
      const data = fs.readFileSync(PANELS_FILE, 'utf-8');
      return JSON.parse(data) as PanelReference[];
    } catch (e) {
      return [];
    }
  }

  public static savePanel(channelId: string, messageId: string, lang: 'id' | 'en' = 'id'): void {
    const panels = this.getPanels();
    const existingIndex = panels.findIndex((p) => p.channelId === channelId && p.messageId === messageId);

    if (existingIndex >= 0) {
      panels[existingIndex] = { channelId, messageId, lang, updatedAt: new Date().toISOString() };
    } else {
      panels.push({ channelId, messageId, lang, updatedAt: new Date().toISOString() });
    }

    fs.writeFileSync(PANELS_FILE, JSON.stringify(panels, null, 2), 'utf-8');
  }

  public static updatePanelLanguage(channelId: string, messageId: string, lang: 'id' | 'en'): void {
    const panels = this.getPanels();
    const existingIndex = panels.findIndex((p) => p.channelId === channelId && p.messageId === messageId);
    if (existingIndex >= 0) {
      panels[existingIndex].lang = lang;
      panels[existingIndex].updatedAt = new Date().toISOString();
      fs.writeFileSync(PANELS_FILE, JSON.stringify(panels, null, 2), 'utf-8');
    }
  }

  public static async refreshActivePanels(): Promise<void> {
    const panels = this.getPanels();
    if (panels.length === 0) return;

    const token = process.env.DISCORD_TOKEN;
    if (!token) return;

    const rest = new REST({ timeout: 60000, retries: 5 }).setToken(token);
    const validPanels: PanelReference[] = [];

    for (const panel of panels) {
      try {
        const containerData = getSetContainer(panel.lang);
        await rest.patch(Routes.channelMessage(panel.channelId, panel.messageId), {
          body: {
            flags: containerData.flags,
            components: containerData.components.map((c) => c.toJSON())
          }
        });
        validPanels.push(panel);
      } catch (err: any) {
        console.error(`[PanelManager] Failed to update panel in channel ${panel.channelId}:`, err.message);
        // If message was deleted or channel not found, skip saving it
      }
    }

    if (validPanels.length !== panels.length) {
      fs.writeFileSync(PANELS_FILE, JSON.stringify(validPanels, null, 2), 'utf-8');
    }
  }
}
