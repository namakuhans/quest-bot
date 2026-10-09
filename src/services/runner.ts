import { GatewayDispatchEvents } from 'discord-api-types/v10';
import { ClientQuest } from './client.js';
import { sendWebhookNotification } from './webhook.js';

export interface UserSessionData {
  userId: string;
  token: string;
  webhookUrl?: string;
  addedAt: string;
}

export class AutoQuestRunner {
  public static async runForUser(token: string, webhookUrl?: string): Promise<{ success: boolean; username?: string; questCount?: number; error?: string }> {
    return new Promise((resolve) => {
      let questClient: ClientQuest | null = null;
      let resolved = false;

      const finish = (result: { success: boolean; username?: string; questCount?: number; error?: string }) => {
        if (!resolved) {
          resolved = true;
          if (questClient) {
            try {
              questClient.destroy();
            } catch (e) {
              // ignore cleanup errors
            }
          }
          resolve(result);
        }
      };

      // Timeout safety (5 minutes)
      const timeout = setTimeout(() => {
        finish({ success: false, error: 'Auto Quest execution timed out.' });
      }, 300000);

      try {
        questClient = new ClientQuest(token);

        questClient.once(GatewayDispatchEvents.Ready, async ({ data }) => {
          const username = `@${data.user.username}`;
          try {
            await questClient!.fetchQuests(false);
            const questsValid = questClient!.questManager!.filterQuestsValidToDo();

            console.log(`[AutoQuest] Logged in as ${username}. Found ${questsValid.length} valid quests to complete.`);

            if (questsValid.length === 0) {
              clearTimeout(timeout);
              finish({ success: true, username, questCount: 0 });
              return;
            }

            // Execute quests concurrently
            await Promise.allSettled(
              questsValid.map(async (quest) => {
                await questClient!.questManager!.doingQuest(quest);

                // If webhook is provided, notify on completion
                if (webhookUrl) {
                  const questTitle = quest.config?.messages?.quest_name || 'Discord Quest';
                  await sendWebhookNotification(webhookUrl, username, questTitle);
                }
              })
            );

            clearTimeout(timeout);
            finish({
              success: true,
              username,
              questCount: questsValid.length
            });
          } catch (err: any) {
            clearTimeout(timeout);
            finish({ success: false, username, error: err.message || 'Error processing quests' });
          }
        });

        questClient.connect();
      } catch (err: any) {
        clearTimeout(timeout);
        finish({ success: false, error: err.message || 'Failed to initialize quest client' });
      }
    });
  }
}
