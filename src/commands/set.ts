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
    header: '🎮 Panel Layanan Auto Quest Discord',
    summary: 'Sistem otomatisasi resmi untuk menyelesaikan Quest Discord aktif secara efisien dan aman.',
    statsTitle: '📊 Statistik Quest',
    buttonLabel: '🔑 Otentikasi Akun & Mulai Auto Quest',
    selectPlaceholder: 'Pilih Bahasa / Select Language'
  },
  en: {
    header: '🎮 Discord Auto Quest Service Panel',
    summary: 'Official automation system to complete active Discord Quests efficiently and securely.',
    statsTitle: '📊 Quest Statistics',
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
