import { REST, Routes } from 'discord.js';
import { getSetContainer } from '../commands/set.js';
import { SessionStorage, PanelConfig } from './sessionStore.js';

export class PanelManager {
  private static tickerInterval: NodeJS.Timeout | null = null;

  public static getPanels(): PanelConfig[] {
    const config = SessionStorage.getConfig();
    return config.activePanels || [];
  }

  public static savePanel(channelId: string, messageId: string, guildId?: string, lang: 'id' | 'en' = 'id'): void {
    const config = SessionStorage.getConfig();
    const existingIndex = config.activePanels.findIndex((p) => p.channelId === channelId && p.messageId === messageId);

    const panelEntry: PanelConfig = {
      guildId,
      channelId,
      messageId,
      lang,
      updatedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      config.activePanels[existingIndex] = panelEntry;
    } else {
      config.activePanels.push(panelEntry);
    }

    SessionStorage.saveConfig(config);
  }

  public static updatePanelLanguage(channelId: string, messageId: string, lang: 'id' | 'en'): void {
    const config = SessionStorage.getConfig();
    const existingIndex = config.activePanels.findIndex((p) => p.channelId === channelId && p.messageId === messageId);
    if (existingIndex >= 0) {
      config.activePanels[existingIndex].lang = lang;
      config.activePanels[existingIndex].updatedAt = new Date().toISOString();
      SessionStorage.saveConfig(config);
    }
  }

  public static async refreshActivePanels(): Promise<void> {
    const config = SessionStorage.getConfig();
    if (!config.activePanels || config.activePanels.length === 0) return;

    const token = process.env.DISCORD_TOKEN;
    if (!token) return;

    const rest = new REST({ timeout: 60000, retries: 5 }).setToken(token);
    const validPanels: PanelConfig[] = [];

    for (const panel of config.activePanels) {
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
        // If message was deleted or channel not found, skip saving it
      }
    }

    if (validPanels.length !== config.activePanels.length) {
      config.activePanels = validPanels;
      SessionStorage.saveConfig(config);
    }
  }

  public static startRealtimeTicker(intervalMs: number = 30000): void {
    if (this.tickerInterval) return;

    // Background safety interval (default 30 seconds) to avoid HTTP 429 rate limits
    this.tickerInterval = setInterval(() => {
      this.refreshActivePanels().catch(() => {});
    }, intervalMs);

    console.log(`⏱️ Background Panel Ticker started (${intervalMs}ms interval)`);
  }

  public static stopRealtimeTicker(): void {
    if (this.tickerInterval) {
      clearInterval(this.tickerInterval);
      this.tickerInterval = null;
    }
  }
}
