import {
  ChatInputCommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder
} from 'discord.js';

export const setCommand = {
  data: new SlashCommandBuilder()
    .setName('set')
    .setDescription('Pasang Panel Login Auto Quest Discord (Owner Only)'),

  async execute(interaction: ChatInputCommandInteraction) {
    const loginButton = new ButtonBuilder()
      .setCustomId('open_login_modal')
      .setLabel('🔑 Input Token & Login Auto Quest')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(loginButton);

    const content =
`# 🎮 AUTO QUEST DISCORD BOT PANEL
---
Selamat datang di Panel Resmi Auto Quest Discord!
Klik tombol di bawah ini untuk menginput token Discord Anda dan memulainya secara otomatis.

**Catatan Keamanan & Informasi:**
• Token Anda hanya digunakan untuk memproses quest yang sedang aktif dan tidak disimpan secara permanen.
• Webhook opsional dapat dimasukkan jika Anda menginginkan notifikasi setelah quest selesai.
• Pastikan akun Anda tidak berpindah sandi saat proses berlangsung.
---`;

    await interaction.reply({
      content,
      components: [row]
    });
  }
};
