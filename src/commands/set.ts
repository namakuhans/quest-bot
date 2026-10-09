import {
  ChatInputCommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  SlashCommandBuilder,
  REST,
  Routes,
  InteractionResponseType
} from 'discord.js';
import { buildContainerV2 } from '../utils/container.js';
import { SessionStorage } from '../services/sessionStore.js';

export const setTexts = {
  id: {
    header: '🎮 Panel Otomatisasi Discord Auto Quest',
    summary:
'Selamat datang di sistem otentikasi resmi Discord Auto Quest!\n\n' +
'Layanan ini dirancang khusus untuk mempermudah Anda dalam mengklaim dan menyelesaikan seluruh Quest Discord yang sedang berlangsung secara otomatis. Tanpa perlu menginstal atau memainkan game secara manual, sistem kami akan memproses tugas quest seperti streaming video, simulasi gameplay desktop, serta aktivitas khusus secara aman di latar belakang.\n\n' +
'Silakan klik tombol **Otentikasi Akun** di bawah ini untuk menginput token akun Anda. Anda juga dapat mencantumkan Webhook URL opsional untuk menerima laporan otomatis saat quest berhasil diselesaikan.',
    statsTitle: '📊 Statistik Layanan Saat Ini',
    buttonLabel: '🔑 Otentikasi Akun & Mulai Auto Quest',
    selectPlaceholder: 'Pilih Bahasa / Select Language'
  },
  en: {
    header: '🎮 Discord Auto Quest Automation Panel',
    summary:
'Welcome to the official Discord Auto Quest authentication portal!\n\n' +
'This service is designed to seamlessly process and complete all active Discord Quests on your behalf. Without requiring manual gameplay or video watching, our automated system handles quest tasks including video streaming, desktop gameplay simulation, and special activity progress securely in the background.\n\n' +
'Click the **Authenticate Account** button below to enter your account token. You may also provide an optional Webhook URL to receive automated real-time completion reports.',
    statsTitle: '📊 Current Service Statistics',
    buttonLabel: '🔑 Authenticate Account & Start Auto Quest',
    selectPlaceholder: 'Select Language / Pilih Bahasa'
  }
};

export function getSetContainer(lang: 'id' | 'en') {
  const sessions = SessionStorage.getSessions();
  const completedCount = sessions.filter((s) => s.lastStatus === 'SUCCESS').length;
  const inProgressCount = sessions.filter((s) => !s.lastStatus || s.lastStatus.startsWith('RUNNING') || s.lastStatus === 'IN_PROGRESS').length;

  const data = setTexts[lang];

  const loginButton = new ButtonBuilder()
    .setCustomId('open_login_modal')
    .setLabel(data.buttonLabel)
    .setStyle(ButtonStyle.Primary);

  const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(loginButton);

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('set_language_select')
    .setPlaceholder(data.selectPlaceholder)
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel('Bahasa Indonesia')
        .setValue('id')
        .setDescription('Tampilkan panel dalam Bahasa Indonesia')
        .setEmoji('🇮🇩')
        .setDefault(lang === 'id'),
      new StringSelectMenuOptionBuilder()
        .setLabel('English')
        .setValue('en')
        .setDescription('Display panel in English')
        .setEmoji('🇺🇸')
        .setDefault(lang === 'en')
    );

  const selectRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

  const statsContent = lang === 'id'
    ? `• Completed: **${completedCount} Quest**\n• In-Progress: **${inProgressCount} Quest**`
    : `• Completed: **${completedCount} Quests**\n• In-Progress: **${inProgressCount} Quests**`;

  return buildContainerV2({
    accentColor: 0x5865f2,
    sections: [
      {
        title: data.header,
        content: data.summary
      },
      {
        title: data.statsTitle,
        content: statsContent
      }
    ],
    actionRows: [buttonRow, selectRow]
  });
}

export const setCommand = {
  data: new SlashCommandBuilder()
    .setName('set')
    .setDescription('Pasang Panel Login Auto Quest Discord (Owner Only)'),

  async execute(interaction: ChatInputCommandInteraction) {
    const containerData = getSetContainer('id');

    const rest = new REST().setToken(interaction.client.token);
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
