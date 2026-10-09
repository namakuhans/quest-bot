import fs from 'fs';
import path from 'path';
import {
  ChatInputCommandInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  SlashCommandBuilder,
  AttachmentBuilder
} from 'discord.js';
import { buildContainerV2 } from '../utils/container.js';

export const howTexts = {
  id: {
    header: '📖 Panduan Penggunaan & Tutorial Discord Auto Quest',
    summary: 'Berikut adalah langkah-langkah mudah untuk mulai menggunakan layanan Discord Auto Quest secara otomatis dan aman.',
    guideTitle: '📌 Langkah-Langkah Penggunaan',
    guideContent:
'1. **Dapatkan Token Akun Discord**\n' +
'   Ambil token otorisasi akun Discord Anda melalui Developer Tools browser atau aplikasi pendukung.\n\n' +
'2. **Otentikasi melalui Panel /set**\n' +
'   Klik tombol **Otentikasi Akun** pada panel utama, lalu tempelkan token akun Anda ke dalam kolom yang tersedia.\n\n' +
'3. **Konfigurasi Webhook (Opsional)**\n' +
'   Masukkan URL Webhook Discord Anda jika ingin menerima notifikasi progress & penyelesaian quest secara otomatis.\n\n' +
'4. **Tonton Video Tutorial**\n' +
'   Simak rekaman panduan video mp4 di atas untuk melihat demonstrasi langkah demi langkah.',
    footerTitle: '🌐 Bahasa / Language',
    footerContent: 'Gunakan select menu di bawah untuk mengubah bahasa panduan.'
  },
  en: {
    header: '📖 Discord Auto Quest User Guide & Tutorial',
    summary: 'Follow these simple steps to start automating your Discord Quests seamlessly and securely.',
    guideTitle: '📌 Step-by-Step Instructions',
    guideContent:
'1. **Obtain Discord Account Token**\n' +
'   Retrieve your Discord account authorization token via browser Developer Tools or helper tools.\n\n' +
'2. **Authenticate via /set Panel**\n' +
'   Click the **Authenticate Account** button on the main panel and paste your token into the modal field.\n\n' +
'3. **Configure Webhook (Optional)**\n' +
'   Provide your Discord Webhook URL if you wish to receive real-time progress and completion alerts.\n\n' +
'4. **Watch Video Tutorial**\n' +
'   Review the attached mp4 video guide above for a step-by-step visual demonstration.',
    footerTitle: '🌐 Language',
    footerContent: 'Use the select menu below to switch the guide language view.'
  }
};

export function getAttachmentFile(): { attachmentPath?: string; fileName?: string } {
  const assetsDir = path.join(process.cwd(), 'assets');
  if (fs.existsSync(assetsDir)) {
    const files = fs.readdirSync(assetsDir);
    // Prioritize specific filename lv_0_20261010035306.mp4 or any .mp4 file in assets
    const mp4File = files.find((f) => f === 'lv_0_20261010035306.mp4') || files.find((f) => f.endsWith('.mp4'));
    if (mp4File) {
      return {
        attachmentPath: path.join(assetsDir, mp4File),
        fileName: mp4File
      };
    }
  }
  return {};
}

export function getHowContainer(lang: 'id' | 'en', fileName?: string) {
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('how_language_select')
    .setPlaceholder('Pilih Bahasa / Select Language')
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel('Bahasa Indonesia')
        .setValue('id')
        .setDescription('Tampilkan panduan dalam Bahasa Indonesia')
        .setEmoji('🇮🇩')
        .setDefault(lang === 'id'),
      new StringSelectMenuOptionBuilder()
        .setLabel('English')
        .setValue('en')
        .setDescription('Display guide in English')
        .setEmoji('🇺🇸')
        .setDefault(lang === 'en')
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
  const data = howTexts[lang] || howTexts.id;

  return buildContainerV2({
    accentColor: 0x5865f2,
    ...(fileName ? { attachmentUrl: `attachment://${fileName}`, useMediaGallery: true } : {}),
    sections: [
      {
        title: data.header,
        content: data.summary
      },
      {
        title: data.guideTitle,
        content: data.guideContent
      },
      {
        title: data.footerTitle,
        content: data.footerContent
      }
    ],
    actionRows: [row]
  });
}

export const howCommand = {
  data: new SlashCommandBuilder()
    .setName('how')
    .setDescription('Tampilkan panduan penggunaan & tutorial mp4 (Owner Only)'),

  async execute(interaction: ChatInputCommandInteraction) {
    // Immediately defer reply to acknowledge the interaction within 3 seconds
    await interaction.deferReply();

    const fileInfo = getAttachmentFile();
    const fileName = fileInfo.fileName;
    const containerData = getHowContainer('id', fileName);

    if (fileInfo.attachmentPath && fileName) {
      const fileBuffer = fs.readFileSync(fileInfo.attachmentPath);
      const attachment = new AttachmentBuilder(fileBuffer, { name: fileName });

      await interaction.editReply({
        flags: containerData.flags as any,
        components: containerData.components as any,
        files: [attachment]
      });
    } else {
      const noFileContainer = getHowContainer('id');
      await interaction.editReply({
        flags: noFileContainer.flags as any,
        components: noFileContainer.components as any
      });
    }
  }
};
