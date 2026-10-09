import {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ModalSubmitInteraction,
  ButtonInteraction,
  StringSelectMenuInteraction,
  REST,
  Routes,
  InteractionResponseType
} from 'discord.js';
import { AutoQuestRunner } from '../services/runner.js';
import { SessionStorage } from '../services/sessionStore.js';
import { getSetContainer } from '../commands/set.js';
import { getFeatsContainer } from '../commands/feats.js';
import { getTosContainer } from '../commands/tos.js';
import { getHowContainer } from '../commands/how.js';

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

          await interaction.followUp({
            content: `✅ **Auto Quest Berhasil Dimulai!**\n• User Host: <@${interaction.user.id}>\n• Akun Selfbot: \`${result.username}\`\n• Quest Ditemukan: \`${result.questCount}\` quest sedang diproses di background.\n• Notifikasi: Laporan penyelesaian quest akan dikirimkan via Webhook.`,
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
            content: `❌ **Otentikasi Gagal**: ${result.error}`,
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
  if (interaction.customId === 'set_language_select') {
    const selectedLang = interaction.values[0] as 'id' | 'en';
    const containerData = getSetContainer(selectedLang);

    const rest = new REST().setToken(interaction.client.token);
    await rest.post(
      Routes.interactionCallback(interaction.id, interaction.token),
      {
        body: {
          type: InteractionResponseType.UpdateMessage,
          data: {
            flags: containerData.flags,
            components: containerData.components.map((c) => c.toJSON())
          }
        }
      }
    );
  } else if (interaction.customId === 'feats_language_select') {
    const selectedLang = interaction.values[0] as 'id' | 'en';
    const containerData = getFeatsContainer(selectedLang);

    const rest = new REST().setToken(interaction.client.token);
    await rest.post(
      Routes.interactionCallback(interaction.id, interaction.token),
      {
        body: {
          type: InteractionResponseType.UpdateMessage,
          data: {
            flags: containerData.flags,
            components: containerData.components.map((c) => c.toJSON())
          }
        }
      }
    );
  } else if (interaction.customId === 'tos_language_select') {
    const selectedLang = interaction.values[0] as 'id' | 'en';
    const containerData = getTosContainer(selectedLang);

    const rest = new REST().setToken(interaction.client.token);
    await rest.post(
      Routes.interactionCallback(interaction.id, interaction.token),
      {
        body: {
          type: InteractionResponseType.UpdateMessage,
          data: {
            flags: containerData.flags,
            components: containerData.components.map((c) => c.toJSON())
          }
        }
      }
    );
  } else if (interaction.customId === 'how_language_select') {
    const selectedLang = interaction.values[0] as 'id' | 'en';
    const containerData = getHowContainer(selectedLang);

    const rest = new REST().setToken(interaction.client.token);
    await rest.post(
      Routes.interactionCallback(interaction.id, interaction.token),
      {
        body: {
          type: InteractionResponseType.UpdateMessage,
          data: {
            flags: containerData.flags,
            components: containerData.components.map((c) => c.toJSON())
          }
        }
      }
    );
  }
}
