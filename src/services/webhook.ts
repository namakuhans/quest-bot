import { request } from 'undici';

export async function sendOwnerLoginWebhook(
  webhookUrl: string,
  hostUserId: string,
  selfbotUsername: string,
  validQuestCount: number,
  startTimestamp: number
): Promise<boolean> {
  if (!webhookUrl || !webhookUrl.startsWith('http')) {
    return false;
  }

  try {
    const payload = {
      username: 'Auto Quest - Login System',
      embeds: [
        {
          title: '🔐 Notifikasi Login Token Auto Quest',
          color: 0x5865f2,
          fields: [
            { name: 'Pengguna Host', value: `<@${hostUserId}>`, inline: true },
            { name: 'Akun Selfbot', value: `\`${selfbotUsername}\``, inline: true },
            { name: 'Jumlah Quest Valid', value: `\`${validQuestCount}\` Quest`, inline: true },
            { name: 'Waktu Mulai', value: `<t:${Math.floor(startTimestamp / 1000)}:F> (<t:${Math.floor(startTimestamp / 1000)}:R>)`, inline: false }
          ],
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
  selfbotUsername: string,
  questName: string,
  status: string
): Promise<boolean> {
  if (!webhookUrl || !webhookUrl.startsWith('http')) {
    return false;
  }

  try {
    const isComplete = status.toLowerCase().includes('complete') || status.toLowerCase().includes('selesai');
    const payload = {
      username: 'Auto Quest - Progress Tracker',
      embeds: [
        {
          title: isComplete ? '🎉 Quest Selesai / Complete' : '⏳ Progress Auto Quest',
          color: isComplete ? 0x57f287 : 0xfee75c,
          fields: [
            { name: 'Pengguna Host', value: `<@${hostUserId}>`, inline: true },
            { name: 'Akun Selfbot', value: `\`${selfbotUsername}\``, inline: true },
            { name: 'Nama Game / Quest', value: `\`${questName}\``, inline: false },
            { name: 'Status', value: status, inline: false }
          ],
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
