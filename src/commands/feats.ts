import {
  ChatInputCommandInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  SlashCommandBuilder
} from 'discord.js';
import { buildContainerV2 } from '../utils/container.js';

export const featsTexts = {
  id: {
    header: '🚀 Fitur Unggulan Sistem Discord Auto Quest',
    summary: 'Platform otomatisasi tingkat lanjut yang dirancang khusus untuk memproses dan menyelesaikan seluruh Quest Discord aktif secara otomatis, presisi, dan aman.',
    coreTitle: '⚡ Fitur Inti Layanan',
    coreContent:
'• **Multi-Task Spoofing Engine**\n' +
'  Mendukung otomatisasi berbagai tipe tugas quest seperti *Video Streaming*, *Desktop Gameplay Simulation*, *Mobile Activity*, serta *Achievement Tracking* secara akurat.\n\n' +
'• **Sistem Otentikasi & Enkripsi Sesi**\n' +
'  Proses login berbasis Modal interaktif resmi. Kredensial akun terlindungi penuh dengan enkripsi standar industri AES-256-GCM pada penyimpanan lokal.\n\n' +
'• **Terintegrasi Webhook Laporan Real-Time**\n' +
'  Pengiriman notifikasi status otomatis secara terpisah untuk log otentikasi owner dan laporan penyelesaian quest pengguna langsung ke channel Discord.\n\n' +
'• **Antarmuka ContainerV2 Modern**\n' +
'  Desain antarmuka panel yang bersih, responsif, dan terstruktur tanpa menggunakan embed tradisional, memberikan pengalaman penggunaan yang intuitif.',
    footerTitle: '🌐 Bahasa / Language',
    footerContent: 'Gunakan select menu di bawah untuk mengubah bahasa tampilan fitur.'
  },
  en: {
    header: '🚀 Discord Auto Quest Core Features',
    summary: 'An advanced automation platform engineered to process and complete all active Discord Quests automatically, precisely, and securely.',
    coreTitle: '⚡ Core System Features',
    coreContent:
'• **Multi-Task Spoofing Engine**\n' +
'  Accurately automates various quest task types including *Video Streaming*, *Desktop Gameplay Simulation*, *Mobile Activity*, and *Achievement Tracking*.\n\n' +
'• **Secure Authentication & Session Encryption**\n' +
'  Interactive Modal-based login flow. Account credentials are strictly protected with industry-standard AES-256-GCM encryption on local storage.\n\n' +
'• **Integrated Real-Time Webhook Reports**\n' +
'  Separate automated webhook dispatching for owner login logs and user quest completion progress alerts sent directly to Discord channels.\n\n' +
'• **Modern ContainerV2 Interface**\n' +
'  Clean, responsive, and structured panel design built using modern Discord components instead of legacy embeds for an intuitive experience.',
    footerTitle: '🌐 Language',
    footerContent: 'Use the select menu below to switch the features language view.'
  }
};

export function getFeatsContainer(lang: 'id' | 'en') {
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('feats_language_select')
    .setPlaceholder('Pilih Bahasa / Select Language')
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel('Bahasa Indonesia')
        .setValue('id')
        .setDescription('Tampilkan fitur dalam Bahasa Indonesia')
        .setEmoji('🇮🇩')
        .setDefault(lang === 'id'),
      new StringSelectMenuOptionBuilder()
        .setLabel('English')
        .setValue('en')
        .setDescription('Display features in English')
        .setEmoji('🇺🇸')
        .setDefault(lang === 'en')
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
  const data = featsTexts[lang];

  return buildContainerV2({
    accentColor: 0x5865f2,
    sections: [
      {
        title: data.header,
        content: data.summary
      },
      {
        title: data.coreTitle,
        content: data.coreContent
      },
      {
        title: data.footerTitle,
        content: data.footerContent
      }
    ],
    actionRows: [row]
  });
}

export const featsCommand = {
  data: new SlashCommandBuilder()
    .setName('feats')
    .setDescription('Tampilkan container fitur inti Auto Quest (Owner Only)'),

  async execute(interaction: ChatInputCommandInteraction) {
    const containerData = getFeatsContainer('id');

    await interaction.reply({
      flags: containerData.flags as any,
      components: containerData.components as any
    });
  }
};
