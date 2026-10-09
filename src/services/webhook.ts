import { request } from 'undici';

export async function sendWebhookNotification(
  webhookUrl: string,
  userTag: string,
  questName: string,
  rewardCode?: string
): Promise<boolean> {
  if (!webhookUrl || !webhookUrl.startsWith('http')) {
    return false;
  }

  try {
    const payload = {
      username: 'Discord Auto Quest Bot',
      embeds: [
        {
          title: '🎉 Quest Successfully Completed!',
          color: 0x57f287,
          fields: [
            { name: 'User', value: userTag, inline: true },
            { name: 'Quest Name', value: questName, inline: true },
            ...(rewardCode ? [{ name: 'Reward Code', value: `\`${rewardCode}\`` }] : [])
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
    console.error('Failed to send webhook notification:', error);
    return false;
  }
}
