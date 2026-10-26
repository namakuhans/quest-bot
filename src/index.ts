import { Client, GatewayIntentBits, REST, Routes, Interaction, Options } from 'discord.js';
import dotenv from 'dotenv';
import { setCommand } from './commands/set.js';
import { featsCommand } from './commands/feats.js';
import { tosCommand } from './commands/tos.js';
import { howCommand } from './commands/how.js';
import {
  handleButtonInteraction,
  handleModalSubmit,
  handleSelectMenuInteraction
} from './events/interactionHandler.js';
import { PanelManager } from './services/panelManager.js';

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const ownerId = process.env.OWNER_ID;

if (!token) {
  console.error('Error: DISCORD_TOKEN is missing in environment variables.');
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
  makeCache: Options.cacheWithLimits({
    MessageManager: 0,
    GuildMemberManager: 0,
    UserManager: 0,
    PresenceManager: 0,
    ReactionManager: 0,
    ThreadManager: 0,
    ThreadMemberManager: 0,
    VoiceStateManager: 0,
    StageInstanceManager: 0,
    GuildScheduledEventManager: 0,
    AutoModerationRuleManager: 0,
    BaseGuildEmojiManager: 0,
    GuildBanManager: 0,
    GuildInviteManager: 0,
    GuildStickerManager: 0,
    ApplicationCommandManager: 0,
    ReactionUserManager: 0
  }),
  rest: {
    timeout: 120000,
    retries: 5
  }
});

client.once('ready', async () => {
  console.log(`🤖 Bot logged in as ${client.user?.tag}`);

  // Register commands
  if (clientId) {
    const rest = new REST({ timeout: 120000, retries: 5 }).setToken(token);
    try {
      console.log('Registering slash commands...');
      await rest.put(Routes.applicationCommands(clientId), {
        body: [
          setCommand.data.toJSON(),
          featsCommand.data.toJSON(),
          tosCommand.data.toJSON(),
          howCommand.data.toJSON()
        ]
      });
      console.log('Successfully registered slash commands!');
    } catch (err) {
      console.error('Failed to register slash commands:', err);
    }
  }

  // Start background panel ticker (30s interval)
  PanelManager.startRealtimeTicker(30000);
});

client.on('interactionCreate', async (interaction: Interaction) => {
  try {
    // Handle Slash Commands
    if (interaction.isChatInputCommand()) {
      // Strict Owner restriction check
      if (!ownerId || interaction.user.id !== ownerId) {
        await interaction.reply({
          content: '❌ Command ini hanya dapat digunakan oleh Bot Owner.',
          ephemeral: true
        });
        return;
      }

      if (interaction.commandName === 'set') {
        await setCommand.execute(interaction);
      } else if (interaction.commandName === 'feats') {
        await featsCommand.execute(interaction);
      } else if (interaction.commandName === 'tos') {
        await tosCommand.execute(interaction);
      } else if (interaction.commandName === 'how') {
        await howCommand.execute(interaction);
      }
      return;
    }

    // Handle Buttons
    if (interaction.isButton()) {
      await handleButtonInteraction(interaction);
      return;
    }

    // Handle Modals
    if (interaction.isModalSubmit()) {
      await handleModalSubmit(interaction);
      return;
    }

    // Handle Select Menus
    if (interaction.isStringSelectMenu()) {
      await handleSelectMenuInteraction(interaction);
      return;
    }
  } catch (error: any) {
    console.error('❌ Error handling interaction:', error);
    if (error.rawError) {
      console.error('❌ Detailed Discord API raw error:', JSON.stringify(error.rawError, null, 2));
    }
  }
});

client.login(token);
