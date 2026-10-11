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
      `Sistem mengonfirmasi sesi otentikasi baru untuk layanan otomatisasi Discord Quest.\n\n` +
      `- Pengguna Host: <@${hostUserId}>\n` +
      `- Akun Selfbot Terhubung: ${selfbotMention}\n` +
      `- Jumlah Quest Valid Ditemukan: **${validQuestCount} Quest**\n` +
      `- Waktu Inisialisasi Sesi: <t:${Math.floor(startTimestamp / 1000)}:R>`;

    const payload = {
      username: 'Auto Quest - Authentication Log',
      embeds: [
        {
          title: '🔐 Laporan Otentikasi & Inisialisasi Sesi',
          color: 0x5865f2,
          description: description,
          footer: {
            text: 'Discord Auto Quest System • Owner Audit Log'
          },
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
      `Laporan pembaruan status otomatisasi quest secara real-time.\n\n` +
      `- Pengguna Host: <@${hostUserId}>\n` +
      `- Akun Selfbot Terhubung: ${selfbotMention}\n` +
      `- Nama Game / Quest: **${questName}**\n` +
      `- Status Pemrosesan: **${status}**`;

    const payload = {
      username: 'Auto Quest - Progress Tracker',
      embeds: [
        {
          title: isComplete ? '🎉 Notifikasi Quest Selesai (Completed)' : '⏳ Pembaruan Progress Auto Quest',
          color: isComplete ? 0x57f287 : 0xfee75c,
          description: description,
          footer: {
            text: 'Discord Auto Quest System • Real-Time Progress Tracker'
          },
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
