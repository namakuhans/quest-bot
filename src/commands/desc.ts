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
    header: '✨ Ringkasan Sistem Discord Auto Quest',
    summary: 'Platform otomatisasi berbasis Discord.js untuk menyelesaikan Quest aktif tanpa perlu eksekusi game atau video secara manual.',
    featuresTitle: '🚀 Fitur Utama',
    featuresContent:
'• **Multi-Task Spoofing**: Mendukung quest video, gameplay desktop, serta aktivitas mobile.\n' +
'• **Integrasi Webhook**: Notifikasi instan ke channel Anda saat quest selesai.\n' +
'• **Enkripsi Sesi**: Kredensial akun terlindungi dengan enkripsi standar industri.\n' +
'• **Antarmuka ContainerV2**: Tampilan panel yang bersih, responsif, dan terstruktur.',
    footerTitle: '🌐 Bahasa',
    footerContent: 'Pilih bahasa antarmuka menggunakan menu di bawah.'
  },
  en: {
    header: '✨ Discord Auto Quest System Overview',
    summary: 'A Discord.js-powered automation platform to efficiently complete active Discord Quests without manual gameplay or video watching.',
    featuresTitle: '🚀 Key Features',
    featuresContent:
'• **Multi-Task Spoofing**: Supports video quests, desktop gameplay, and mobile activities.\n' +
'• **Webhook Integration**: Instant completion alerts sent straight to your channel.\n' +
'• **Session Encryption**: Account tokens are secured using industry-standard encryption.\n' +
'• **ContainerV2 Interface**: Clean, responsive, and structured panel layout.',
    footerTitle: '🌐 Language',
    footerContent: 'Select your preferred interface language from the menu below.'
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
  const data = descTexts[lang];

  return buildContainerV2({
    accentColor: 0x5865f2,
    sections: [
      {
        title: data.header,
        content: data.summary
      },
      {
        title: data.featuresTitle,
        content: data.featuresContent
      },
      {
        title: data.footerTitle,
        content: data.footerContent
      }
    ],
    actionRows: [row]
  });
}

export const descCommand = {
  data: new SlashCommandBuilder()
    .setName('desc')
    .setDescription('Tampilkan container deskripsi & fitur bot (Owner Only)'),

  async execute(interaction: ChatInputCommandInteraction) {
    const containerData = getDescContainer('id');

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
