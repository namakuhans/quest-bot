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

export const tosTexts = {
  id: {
    header: '📜 Syarat & Ketentuan Layanan (Terms of Service)',
    summary: 'Dengan menggunakan layanan Discord Auto Quest ini, Anda menyatakan telah membaca, memahami, dan menyetujui seluruh ketentuan di bawah ini.',
    cautionTitle: '⚠️ Caution (Peringatan Penting)',
    cautionContent:
'Discord secara aktif memantau dan menindak otomatisasi penyelesaian quest.\n' +
'Sistem dapat mendeteksi aktivitas Quest yang tidak wajar dan mengirimkan *Quest Activity Notice* ke akun pengguna.\n' +
'Penggunaan script, alat, atau metode pihak ketiga untuk memalsukan penyelesaian quest merupakan pelanggaran terhadap kebijakan *Inauthentic Engagement* Discord.',
    warningTitle: '⛔ Warning (Penafian Tanggung Jawab)',
    warningContent:
'• **Risiko Ditanggung Pengguna**: Kami tidak bertanggung jawab atas segala tindakan disipliner, pembatasan akses quest, penangguhan, atau pemblokiran akun oleh Discord.\n' +
'• **Pelanggan Discord TOS**: Penggunaan selfbot pada akun pengguna dilarang oleh Syarat Layanan Resmi Discord.\n' +
'• **Gunakan Dengan Risiko Sendiri**: Seluruh risiko penggunaan alat ini sepenuhnya menjadi tanggung jawab pemilik akun.',
    rulesTitle: '⚖️ Ketentuan Penggunaan',
    rulesContent:
'1. **Kerahasiaan Token**: Token yang dimasukkan hanya digunakan untuk proses Quest dan disimpan secara terenkripsi AES-256.\n' +
'2. **Penyalahgunaan**: Dilarang keras melakukan spam, manipulasi data, atau tindakan yang merugikan infrastruktur bot.\n' +
'3. **Perubahan Ketentuan**: Syarat & Ketentuan ini dapat diperbarui sewaktu-waktu tanpa pemberitahuan sebelumnya.',
    footerTitle: '🌐 Bahasa / Language',
    footerContent: 'Gunakan select menu di bawah untuk mengubah bahasa tampilan ToS.'
  },
  en: {
    header: '📜 Terms of Service (ToS)',
    summary: 'By using this Discord Auto Quest service, you acknowledge that you have read, understood, and agreed to all terms outlined below.',
    cautionTitle: '⚠️ Caution (Important Notice)',
    cautionContent:
'Discord actively monitors and crackdowns on automated quest completions.\n' +
'Systems may detect unusual Quest activity and issue a *Quest Activity Notice* to user accounts.\n' +
'Relying on scripts, tools, or third-party methods to fake Quest completion violates Discord\'s *Inauthentic Engagement* policy.',
    warningTitle: '⛔ Warning (Disclaimer)',
    warningContent:
'• **User Assumption of Risk**: We take no responsibility for any disciplinary actions, quest access limitations, account suspensions, or bans imposed by Discord.\n' +
'• **Discord TOS Prohibition**: Using selfbot automation on user accounts is prohibited by official Discord Terms of Service.\n' +
'• **Use At Your Own Risk**: All risks associated with using this tool rest entirely with the account owner.',
    rulesTitle: '⚖️ Terms & Conditions',
    rulesContent:
'1. **Token Privacy**: Submitted tokens are exclusively used for quest processing and stored using AES-256 encryption.\n' +
'2. **Prohibited Use**: Abuse, spamming, or attempts to disrupt bot infrastructure are strictly prohibited.\n' +
'3. **ToS Updates**: These Terms of Service may be updated periodically without prior notice.',
    footerTitle: '🌐 Language',
    footerContent: 'Use the select menu below to switch the ToS language view.'
  }
};

export function getTosNoticeAttachment(): { attachmentPath?: string; fileName?: string } {
  const assetsDir = path.join(process.cwd(), 'assets');
  const noticePath = path.join(assetsDir, 'notice.png');
  if (fs.existsSync(noticePath)) {
    return {
      attachmentPath: noticePath,
      fileName: 'notice.png'
    };
  }
  return {};
}

export function getTosContainer(lang: 'id' | 'en', fileName?: string) {
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
  const data = tosTexts[lang] || tosTexts.id;

  return buildContainerV2({
    accentColor: 0xed4245,
    ...(fileName ? { attachmentUrl: `attachment://${fileName}`, useMediaGallery: true } : {}),
    sections: [
      {
        title: data.header,
        content: data.summary
      },
      {
        title: data.cautionTitle,
        content: data.cautionContent
      },
      {
        title: data.warningTitle,
        content: data.warningContent
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
    await interaction.deferReply();

    const noticeInfo = getTosNoticeAttachment();
    const fileName = noticeInfo.fileName;
    const containerData = getTosContainer('id', fileName);

    if (noticeInfo.attachmentPath && fileName) {
      const fileBuffer = fs.readFileSync(noticeInfo.attachmentPath);
      const attachment = new AttachmentBuilder(fileBuffer, { name: fileName });

      await interaction.editReply({
        flags: containerData.flags as any,
        components: containerData.components as any,
        files: [attachment]
      });
    } else {
      const noFileContainer = getTosContainer('id');
      await interaction.editReply({
        flags: noFileContainer.flags as any,
        components: noFileContainer.components as any
      });
    }
  }
};
