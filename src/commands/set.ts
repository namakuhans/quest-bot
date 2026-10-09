import {
  ChatInputCommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
  REST,
  Routes,
  InteractionResponseType
} from 'discord.js';
import { buildContainerV2 } from '../utils/container.js';

export const setCommand = {
  data: new SlashCommandBuilder()
    .setName('set')
    .setDescription('Pasang Panel Login Auto Quest Discord (Owner Only)'),

  async execute(interaction: ChatInputCommandInteraction) {
    const loginButton = new ButtonBuilder()
      .setCustomId('open_login_modal')
      .setLabel('🔑 Otentikasi Akun & Mulai Auto Quest')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(loginButton);

    const containerData = buildContainerV2({
      accentColor: 0x5865f2,
      sections: [
        {
          title: '🎮 Panel Layanan Auto Quest Discord',
          content: 'Sistem otomatisasi resmi untuk menyelesaikan Quest Discord aktif secara efisien dan aman.'
        },
        {
          title: '📌 Panduan Penggunaan',
          content:
'1. Klik tombol **Otentikasi Akun** di bawah ini.\n' +
'2. Masukkan token otorisasi akun Discord Anda.\n' +
'3. *(Opsional)* Cantumkan URL Webhook untuk notifikasi hasil quest.'
        },
        {
          title: '🔒 Keamanan & Kebijakan',
          content: '• Kredensial diproses dengan enkripsi AES-256 dan tidak disimpan secara permanen.\n• Proses quest langsung berjalan secara otomatis setelah otentikasi.'
        }
      ],
      actionRows: [row]
    });

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
