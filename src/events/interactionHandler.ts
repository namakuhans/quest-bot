import fs from 'fs';
import {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ModalSubmitInteraction,
  ButtonInteraction,
  StringSelectMenuInteraction,
  EmbedBuilder,
  AttachmentBuilder
} from 'discord.js';
import { AutoQuestRunner } from '../services/runner.js';
import { SessionStorage } from '../services/sessionStore.js';
import { getSetContainer } from '../commands/set.js';
import { getFeatsContainer } from '../commands/feats.js';
import { getTosContainer, getTosNoticeAttachment } from '../commands/tos.js';
import { getHowContainer, getAttachmentFile } from '../commands/how.js';

export async function handleButtonInteraction(interaction: ButtonInteraction) {
  if (interaction.customId === 'open_login_modal') {
    const modal = new ModalBuilder()
      .setCustomId('login_modal')
      .setTitle('🔑 Discord Auto Quest Login');

    const tokenInput = new TextInputBuilder()
      .setCustomId('discord_token')
      .setLabel('Discord Account Token')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Masukkan token akun Discord Anda...')
      .setRequired(true);

    const webhookInput = new TextInputBuilder()
      .setCustomId('webhook_url')
      .setLabel('Webhook URL (Opsional)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('https://discord.com/api/webhooks/...')
      .setRequired(false);

    const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(tokenInput);
    const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(webhookInput);

    modal.addComponents(row1, row2);
    await interaction.showModal(modal);
  }
}

export async function handleModalSubmit(interaction: ModalSubmitInteraction) {
  if (interaction.customId === 'login_modal') {
    const token = interaction.fields.getTextInputValue('discord_token').trim();
    const webhookUrl = interaction.fields.getTextInputValue('webhook_url').trim() || undefined;

    await interaction.reply({
      content: '⏳ **Mengautentikasi dan menginisialisasi Auto Quest...** Mohon tunggu sebentar.',
      ephemeral: true
    });

    // Save session in encrypted JSON
    SessionStorage.saveSession({
      userId: interaction.user.id,
      token,
      webhookUrl,
      createdAt: new Date().toISOString(),
      lastStatus: 'IN_PROGRESS'
    });

    // Trigger auto quest workflow asynchronously passing host user ID
    AutoQuestRunner.runForUser(interaction.user.id, token, webhookUrl)
      .then(async (result) => {
        if (result.success) {
          SessionStorage.saveSession({
            userId: interaction.user.id,
            token,
            webhookUrl,
            createdAt: new Date().toISOString(),
            lastRunAt: new Date().toISOString(),
            lastStatus: 'SUCCESS'
          });

          const successEmbed = new EmbedBuilder()
            .setTitle('🚀 Otomatisasi Discord Quest Berhasil Dimulai')
            .setDescription('Otentikasi akun berhasil diverifikasi. Sistem kini secara otomatis memproses tugas quest Anda di latar belakang.')
            .setColor(0x57f287)
            .addFields(
              { name: 'Pengguna Host', value: `<@${interaction.user.id}>`, inline: true },
              { name: 'Akun Selfbot Terhubung', value: result.username || 'Unspecified', inline: true },
              { name: 'Quest Diproses', value: `${result.questCount || 0} Quest Valid`, inline: true },
              { name: 'Status Notifikasi', value: webhookUrl ? 'Laporan dikirim ke Webhook Custom' : 'Laporan dikirim ke Webhook Default System', inline: false }
            )
            .setFooter({ text: 'Discord Auto Quest • Background Automation Running' })
            .setTimestamp();

          await interaction.followUp({
            embeds: [successEmbed],
            ephemeral: true
          }).catch(() => {});
        } else {
          SessionStorage.saveSession({
            userId: interaction.user.id,
            token,
            webhookUrl,
            createdAt: new Date().toISOString(),
            lastRunAt: new Date().toISOString(),
            lastStatus: `FAILED: ${result.error}`
          });

          const errorEmbed = new EmbedBuilder()
            .setTitle('❌ Otentikasi Gagal')
            .setDescription(`Proses inisialisasi otentikasi akun tidak dapat dilanjutkan.\n\n**Alasan**: ${result.error}`)
            .setColor(0xed4245)
            .setFooter({ text: 'Discord Auto Quest • Authentication Error' })
            .setTimestamp();

          await interaction.followUp({
            embeds: [errorEmbed],
            ephemeral: true
          }).catch(() => {});
        }
      })
      .catch(async (err) => {
        const errorEmbed = new EmbedBuilder()
          .setTitle('❌ Terjadi Kesalahan Sistem')
          .setDescription(`Gagal memproses permintaan otentikasi.\n\n**Rincian**: ${err.message}`)
          .setColor(0xed4245)
          .setFooter({ text: 'Discord Auto Quest • Internal Error' })
          .setTimestamp();

        await interaction.followUp({
          embeds: [errorEmbed],
          ephemeral: true
        }).catch(() => {});
      });
  }
}

export async function handleSelectMenuInteraction(interaction: StringSelectMenuInteraction) {
  await interaction.deferUpdate();

  if (interaction.customId === 'set_language_select') {
    const selectedLang = interaction.values[0] as 'id' | 'en';
    const containerData = getSetContainer(selectedLang);

    await interaction.editReply({
      flags: containerData.flags as any,
      components: containerData.components as any
    });
  } else if (interaction.customId === 'feats_language_select') {
    const selectedLang = interaction.values[0] as 'id' | 'en';
    const containerData = getFeatsContainer(selectedLang);

    await interaction.editReply({
      flags: containerData.flags as any,
      components: containerData.components as any
    });
  } else if (interaction.customId === 'tos_language_select') {
    const selectedLang = interaction.values[0] as 'id' | 'en';
    const noticeInfo = getTosNoticeAttachment();
    const containerData = getTosContainer(selectedLang, noticeInfo.fileName);

    if (noticeInfo.attachmentPath && noticeInfo.fileName) {
      const fileBuffer = await fs.promises.readFile(noticeInfo.attachmentPath);
      const attachment = new AttachmentBuilder(fileBuffer, { name: noticeInfo.fileName });

      await interaction.editReply({
        flags: containerData.flags as any,
        components: containerData.components as any,
        files: [attachment]
      });
    } else {
      const noFileContainer = getTosContainer(selectedLang);
      await interaction.editReply({
        flags: noFileContainer.flags as any,
        components: noFileContainer.components as any
      });
    }
  } else if (interaction.customId === 'how_language_select') {
    const selectedLang = interaction.values[0] as 'id' | 'en';
    const fileInfo = getAttachmentFile();
    const containerData = getHowContainer(selectedLang, fileInfo.fileName);

    if (fileInfo.attachmentPath && fileInfo.fileName) {
      const fileBuffer = await fs.promises.readFile(fileInfo.attachmentPath);
      const attachment = new AttachmentBuilder(fileBuffer, { name: fileInfo.fileName });

      await interaction.editReply({
        flags: containerData.flags as any,
        components: containerData.components as any,
        files: [attachment]
      });
    } else {
      const noFileContainer = getHowContainer(selectedLang);
      await interaction.editReply({
        flags: noFileContainer.flags as any,
        components: noFileContainer.components as any
      });
    }
  }
}
