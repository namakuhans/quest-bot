import {
  ChatInputCommandInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  SlashCommandBuilder,
  REST,
  Routes,
  InteractionResponseType
} from 'discord.js';
import { buildContainerV2 } from '../utils/container.js';

export const tosTexts = {
  id: {
    header: '📜 Syarat & Ketentuan Layanan (Terms of Service)',
    summary: 'Dengan menggunakan layanan Discord Auto Quest ini, Anda menyatakan telah membaca, memahami, dan menyetujui seluruh ketentuan di bawah ini.',
    rulesTitle: '⚖️ Ketentuan Penggunaan',
    rulesContent:
'1. **Risiko Akun**: Penggunaan alat otomatisasi/selfbot pada akun pengguna memiliki risiko terhadap Syarat Layanan resmi Discord. Segala risiko akun berada di luar tanggung jawab penyedia layanan.\n' +
'2. **Kerahasiaan Token**: Token yang dimasukkan hanya digunakan untuk proses Quest dan disimpankan secara terenkripsi AES-256.\n' +
'3. **Penyalahgunaan**: Dilarang keras melakukan spam, manipulasi data, atau tindakan yang merugikan infrastruktur bot.\n' +
'4. **Perubahan Ketentuan**: Syarat & Ketentuan ini dapat diperbarui sewaktu-waktu tanpa pemberitahuan sebelumnya.',
    footerTitle: '🌐 Bahasa / Language',
    footerContent: 'Gunakan select menu di bawah untuk mengubah bahasa tampilan ToS.'
  },
  en: {
    header: '📜 Terms of Service (ToS)',
    summary: 'By using this Discord Auto Quest service, you acknowledge that you have read, understood, and agreed to all terms outlined below.',
    rulesTitle: '⚖️ Terms & Conditions',
    rulesContent:
'1. **Account Risk**: Using automation/selfbot tools on user accounts carries inherent risks regarding Discord Terms of Service. Account safety remains the sole responsibility of the user.\n' +
'2. **Token Privacy**: Submitted tokens are exclusively used for quest processing and stored using AES-256 encryption.\n' +
'3. **Prohibited Use**: Abuse, spamming, or attempts to disrupt bot infrastructure are strictly prohibited.\n' +
'4. **ToS Updates**: These Terms of Service may be updated periodically without prior notice.',
    footerTitle: '🌐 Language',
    footerContent: 'Use the select menu below to switch the ToS language view.'
  }
};

export function getTosContainer(lang: 'id' | 'en') {
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('tos_language_select')
    .setPlaceholder('Pilih Bahasa / Select Language')
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel('Bahasa Indonesia')
        .setValue('id')
        .setDescription('Tampilkan ToS dalam Bahasa Indonesia')
        .setEmoji('🇮🇩')
        .setDefault(lang === 'id'),
      new StringSelectMenuOptionBuilder()
        .setLabel('English')
        .setValue('en')
        .setDescription('Display ToS in English')
        .setEmoji('🇺🇸')
        .setDefault(lang === 'en')
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
  const data = tosTexts[lang];

  return buildContainerV2({
    accentColor: 0xed4245,
    sections: [
      {
        title: data.header,
        content: data.summary
      },
      {
        title: data.rulesTitle,
        content: data.rulesContent
      },
      {
        title: data.footerTitle,
        content: data.footerContent
      }
    ],
    actionRows: [row]
  });
}

export const tosCommand = {
  data: new SlashCommandBuilder()
    .setName('tos')
    .setDescription('Tampilkan container Syarat & Ketentuan / Terms of Service (Owner Only)'),

  async execute(interaction: ChatInputCommandInteraction) {
    const containerData = getTosContainer('id');

    const rest = new REST({ timeout: 60000, retries: 5 }).setToken(interaction.client.token);
    await rest.post(
      Routes.interactionCallback(interaction.id, interaction.token),
      {
        body: {
          type: InteractionResponseType.ChannelMessageWithSource,
          data: {
            flags: containerData.flags,
            components: containerData.components.map((c) => c.toJSON())
          }
        }
      }
    );
  }
};
