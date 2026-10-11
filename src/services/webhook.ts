import { request } from 'undici';

export async function sendOwnerLoginWebhook(
  webhookUrl: string,
  hostUserId: string,
  selfbotUserId: string,
  validQuestCount: number,
  startTimestamp: number
): Promise<boolean> {
  if (!webhookUrl || !webhookUrl.startsWith('http')) {
    return false;
  }

  try {
    const selfbotMention = selfbotUserId ? `<@${selfbotUserId}>` : `@Unknown`;

    const description =
      `- Pengguna Host: <@${hostUserId}>\n` +
      `- Akun Selfbot: ${selfbotMention}\n` +
      `- Jumlah Quest Valid: **${validQuestCount} Quest**\n` +
      `- Waktu Mulai: <t:${Math.floor(startTimestamp / 1000)}:R>`;

    const payload = {
      username: 'Auto Quest - Login System',
      embeds: [
        {
          title: '🔐 Notifikasi Login Token Auto Quest',
          color: 0x5865f2,
          description: description,
          timestamp: new Date().toISOString()
        }
      ]
    };

    const res = await request(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    return res.statusCode >= 200 && res.statusCode < 300;
  } catch (error) {
    console.error('Failed to send owner login webhook:', error);
    return false;
  }
}

export async function sendQuestProgressWebhook(
  webhookUrl: string,
  hostUserId: string,
  selfbotUserId: string,
  questName: string,
  status: string
): Promise<boolean> {
  if (!webhookUrl || !webhookUrl.startsWith('http')) {
    return false;
  }

  try {
    const isComplete = status.toLowerCase().includes('complete') || status.toLowerCase().includes('selesai');
    const selfbotMention = selfbotUserId ? `<@${selfbotUserId}>` : `@Unknown`;

    const description =
      `- Pengguna Host: <@${hostUserId}>\n` +
      `- Akun Selfbot: ${selfbotMention}\n` +
      `- Nama Game / Quest: **${questName}**\n` +
      `- Status: **${status}**`;

    const payload = {
      username: 'Auto Quest - Progress Tracker',
      embeds: [
        {
          title: isComplete ? '🎉 Quest Selesai / Complete' : '⏳ Progress Auto Quest',
          color: isComplete ? 0x57f287 : 0xfee75c,
          description: description,
          timestamp: new Date().toISOString()
        }
      ]
    };

    const res = await request(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    return res.statusCode >= 200 && res.statusCode < 300;
  } catch (error) {
    console.error('Failed to send quest progress webhook:', error);
    return false;
  }
}
