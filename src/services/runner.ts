import { GatewayDispatchEvents, GatewayDispatchPayload } from 'discord-api-types/v10';
import { WebSocketShardEvents } from '@discordjs/ws';
import { ClientQuest } from './client.js';
import { sendWebhookNotification } from './webhook.js';

export class AutoQuestRunner {
  public static async runForUser(
    token: string,
    webhookUrl?: string
  ): Promise<{ success: boolean; username?: string; questCount?: number; error?: string }> {
    const targetWebhook = webhookUrl || process.env.DEFAULT_WEBHOOK_URL || process.env.WEBHOOK_URL;

    return new Promise((resolve) => {
      let questClient: ClientQuest | null = null;
      let resolved = false;

      const finishInitial = (result: { success: boolean; username?: string; questCount?: number; error?: string }) => {
        if (!resolved) {
          resolved = true;
          resolve(result);
        }
      };

      // Initial login timeout safety (45 seconds for initial connection & quest discovery)
      const initialTimeout = setTimeout(() => {
        finishInitial({ success: false, error: 'Otentikasi atau koneksi awal ke Discord melebihi batas waktu.' });
        if (questClient) {
          try {
            questClient.destroy();
          } catch (e) {}
        }
      }, 45000);

      try {
        questClient = new ClientQuest(token);

        questClient.websocketManager.on(WebSocketShardEvents.Dispatch, async (event: any) => {
          const payload: GatewayDispatchPayload = event?.data ?? event;
          if (payload && payload.t === GatewayDispatchEvents.Ready) {
            clearTimeout(initialTimeout);
            const username = `@${payload.d.user.username}`;
            try {
              await questClient!.fetchQuests(false);
              const questsValid = questClient!.questManager!.filterQuestsValidToDo();

              console.log(`[AutoQuest] Logged in as ${username}. Found ${questsValid.length} valid quests to complete.`);

              // Return initial status immediately to the interaction handler
              finishInitial({
                success: true,
                username,
                questCount: questsValid.length
              });

              if (questsValid.length === 0) {
                try {
                  questClient!.destroy();
                } catch (e) {}
                return;
              }

              // Process quest execution asynchronously in the background
              Promise.allSettled(
                questsValid.map(async (quest: any) => {
                  await questClient!.questManager!.doingQuest(quest);

                  // Send webhook notification on quest completion if webhook exists
                  if (targetWebhook) {
                    const questTitle = quest.config?.messages?.quest_name || 'Discord Quest';
                    await sendWebhookNotification(targetWebhook, username, questTitle);
                  }
                })
              ).then(() => {
                console.log(`[AutoQuest] Completed all background quests for ${username}.`);
                try {
                  questClient!.destroy();
                } catch (e) {}
              }).catch((err) => {
                console.error(`[AutoQuest] Background execution error for ${username}:`, err);
                try {
                  questClient!.destroy();
                } catch (e) {}
              });

            } catch (err: any) {
              finishInitial({ success: false, username, error: err.message || 'Gagal mengambil daftar quest.' });
              try {
                questClient!.destroy();
              } catch (e) {}
            }
          }
        });

        questClient.connect();
      } catch (err: any) {
        clearTimeout(initialTimeout);
        finishInitial({ success: false, error: err.message || 'Gagal menginisialisasi client quest.' });
      }
    });
  }
}
