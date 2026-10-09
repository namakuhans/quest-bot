import {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ModalSubmitInteraction,
  ButtonInteraction,
  StringSelectMenuInteraction,
  Interaction
} from 'discord.js';
import { AutoQuestRunner } from '../services/runner.js';
import { SessionStorage } from '../services/sessionStore.js';
import { descTexts } from '../commands/desc.js';

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
      content: '⏳ **Memverifikasi token dan menginisialisasi Auto Quest...** Mohon tunggu sebentar.',
      ephemeral: true
    });

    // Save session in JSON
    SessionStorage.saveSession({
      userId: interaction.user.id,
      token,
      webhookUrl,
      createdAt: new Date().toISOString()
    });

    // Trigger auto quest workflow asynchronously
    AutoQuestRunner.runForUser(token, webhookUrl)
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

          await interaction.followUp({
            content: `✅ **Auto Quest Berhasil Dijalankan!**\n• User: \`${result.username}\`\n• Total Quest Diproses: \`${result.questCount}\``,
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

          await interaction.followUp({
            content: `❌ **Gagal Menjalankan Auto Quest**: ${result.error}`,
            ephemeral: true
          }).catch(() => {});
        }
      })
      .catch(async (err) => {
        await interaction.followUp({
          content: `❌ **Terjadi kesalahan tak terduga**: ${err.message}`,
          ephemeral: true
        }).catch(() => {});
      });
  }
}

export async function handleSelectMenuInteraction(interaction: StringSelectMenuInteraction) {
  if (interaction.customId === 'desc_language_select') {
    const selectedLang = interaction.values[0] as 'id' | 'en';
    const langData = descTexts[selectedLang] || descTexts.id;

    const content = `# ${langData.title}\n${langData.description}`;

    await interaction.update({
      content,
      components: interaction.message.components
    });
  }
}
