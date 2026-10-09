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

export const descTexts = {
  id: {
    title: '✨ Latar Belakang & Fitur Auto Quest Bot',
    description:
`**Deskripsi Singkat:**
Bot ini didesain untuk membantu Anda menyelesaikan berbagai Quest Discord secara otomatis dan efisien tanpa perlu memainkan game atau menonton video secara manual.

**Fitur Utama:**
• 🚀 **Otomatisasi Penuh**: Otomatis mendaftar dan menjalankan quest yang tersedia.
• 📹 **Video & Desktop Spoofing**: Mendukung quest tipe WATCH_VIDEO, PLAY_ON_DESKTOP, WATCH_VIDEO_ON_MOBILE, dll.
• 🔔 **Notifikasi Webhook**: Kirim laporan penyelesaian quest langsung ke channel Discord Anda via Webhook.
• 🔒 **Sistem Login Aman**: Panel interaktif berbasis Modal Login resmi.`
  },
  en: {
    title: '✨ Auto Quest Bot Overview & Features',
    description:
`**Brief Description:**
This bot is designed to automatically and efficiently complete active Discord Quests for you without manual gameplay or video watching.

**Key Features:**
• 🚀 **Full Automation**: Automatically enrolls and completes active quests.
• 📹 **Video & Desktop Spoofing**: Supports task types such as WATCH_VIDEO, PLAY_ON_DESKTOP, WATCH_VIDEO_ON_MOBILE, etc.
• 🔔 **Webhook Notifications**: Receive quest completion reports directly in your Discord channel via Webhook.
• 🔒 **Secure Login System**: Interactive panel powered by official Modal Login.`
  }
};

export function getDescContainer(lang: 'id' | 'en') {
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('desc_language_select')
    .setPlaceholder('Pilih Bahasa / Select Language')
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel('Bahasa Indonesia')
        .setValue('id')
        .setDescription('Tampilkan deskripsi dalam Bahasa Indonesia')
        .setEmoji('🇮🇩')
        .setDefault(lang === 'id'),
      new StringSelectMenuOptionBuilder()
        .setLabel('English')
        .setValue('en')
        .setDescription('Display description in English')
        .setEmoji('🇺🇸')
        .setDefault(lang === 'en')
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
  const langData = descTexts[lang];
  const content = `# ${langData.title}\n***\n${langData.description}`;

  return buildContainerV2({
    accentColor: 0x001000,
    content,
    actionRows: [row]
  });
}

export const descCommand = {
  data: new SlashCommandBuilder()
    .setName('desc')
    .setDescription('Tampilkan container deskripsi & fitur bot (Owner Only)'),

  async execute(interaction: ChatInputCommandInteraction) {
    const containerComponents = getDescContainer('id');

    const rest = new REST().setToken(interaction.client.token);
    await rest.post(
      Routes.interactionCallback(interaction.id, interaction.token),
      {
        body: {
          type: InteractionResponseType.ChannelMessageWithSource,
          data: {
            components: containerComponents
          }
        }
      }
    );
  }
};
