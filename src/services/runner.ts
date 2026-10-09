import { GatewayDispatchEvents, GatewayDispatchPayload } from 'discord-api-types/v10';
import { WebSocketShardEvents } from '@discordjs/ws';
import { ClientQuest } from './client.js';
import { sendOwnerLoginWebhook, sendQuestProgressWebhook } from './webhook.js';
import { SessionStorage } from './sessionStore.js';

export class AutoQuestRunner {
  public static async runForUser(
    hostUserId: string,
    token: string,
    userCustomWebhookUrl?: string
  ): Promise<{ success: boolean; username?: string; questCount?: number; error?: string }> {
    // Separate Webhook URLs
    const ownerLoginWebhook = process.env.OWNER_LOGIN_WEBHOOK_URL;
    const progressWebhook = userCustomWebhookUrl || process.env.DEFAULT_PROGRESS_WEBHOOK_URL;
    const startTimestamp = Date.now();

    return new Promise((resolve) => {
      let questClient: ClientQuest | null = null;
      let resolved = false;

      const finishInitial = (result: { success: boolean; username?: string; questCount?: number; error?: string }) => {
        if (!resolved) {
          resolved = true;
          resolve(result);
        }
      };

      // Initial login timeout safety (45 seconds)
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
            const selfbotUsername = `@${payload.d.user.username}`;
            try {
              await questClient!.fetchQuests(false);
              const questsValid = questClient!.questManager!.filterQuestsValidToDo();

              console.log(`[AutoQuest] Logged in as ${selfbotUsername}. Found ${questsValid.length} valid quests.`);

              // Increment persistent in-progress stats
              if (questsValid.length > 0) {
                SessionStorage.incrementInProgressQuests(questsValid.length);
              }

              // Send Owner Login Webhook to OWNER_LOGIN_WEBHOOK_URL if configured
              if (ownerLoginWebhook) {
                await sendOwnerLoginWebhook(
                  ownerLoginWebhook,
                  hostUserId,
                  selfbotUsername,
                  questsValid.length,
                  startTimestamp
                );
              }

              // Return initial response to user immediately
              finishInitial({
                success: true,
                username: selfbotUsername,
                questCount: questsValid.length
              });

              if (questsValid.length === 0) {
                try {
                  questClient!.destroy();
                } catch (e) {}
                return;
              }

              // Process background quests
              Promise.allSettled(
                questsValid.map(async (quest: any) => {
                  const questTitle = quest.config?.messages?.quest_name || 'Discord Quest';

                  // Send Initial Progress Notification to progressWebhook
                  if (progressWebhook) {
                    await sendQuestProgressWebhook(
                      progressWebhook,
                      hostUserId,
                      selfbotUsername,
                      questTitle,
                      '⏳ Memulai proses otomatisasi quest...'
                    );
                  }

                  await questClient!.questManager!.doingQuest(quest);

                  // Increment persistent completed quest stats upon completion
                  SessionStorage.incrementCompletedQuests(1);

                  // Send Completion Notification to progressWebhook
                  if (progressWebhook) {
                    await sendQuestProgressWebhook(
                      progressWebhook,
                      hostUserId,
                      selfbotUsername,
                      questTitle,
                      '✅ Quest telah berhasil diselesaikan! (Complete)'
                    );
                  }
                })
              ).then(() => {
                console.log(`[AutoQuest] Completed all background quests for ${selfbotUsername}.`);
                try {
                  questClient!.destroy();
                } catch (e) {}
              }).catch((err) => {
                console.error(`[AutoQuest] Background execution error for ${selfbotUsername}:`, err);
                try {
                  questClient!.destroy();
                } catch (e) {}
              });

            } catch (err: any) {
              finishInitial({ success: false, username: selfbotUsername, error: err.message || 'Gagal mengambil daftar quest.' });
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
