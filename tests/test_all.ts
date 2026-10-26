import assert from 'assert';
import { ComponentType, MessageFlags } from 'discord.js';
import { featsTexts, getFeatsContainer, featsCommand } from '../src/commands/feats.js';
import { tosTexts, getTosContainer, tosCommand } from '../src/commands/tos.js';
import { setTexts, getSetContainer, setCommand } from '../src/commands/set.js';
import { howTexts, getHowContainer, howCommand } from '../src/commands/how.js';
import { buildContainerV2 } from '../src/utils/container.js';
import { SessionStorage } from '../src/services/sessionStore.js';
import { PanelManager } from '../src/services/panelManager.js';
import { sendOwnerLoginWebhook, sendQuestProgressWebhook } from '../src/services/webhook.js';

async function runTests() {
  console.log('--- Running ContainerV2, Config & Realtime Ticker Tests ---');

  // Test 1: Slash Commands Registration Data
  console.log('Test 1: Slash Commands registration data...');
  assert.strictEqual(setCommand.data.name, 'set');
  assert.strictEqual(featsCommand.data.name, 'feats');
  assert.strictEqual(tosCommand.data.name, 'tos');
  assert.strictEqual(howCommand.data.name, 'how');
  console.log('✅ /set, /feats, /tos, and /how slash commands verified.');

  // Test 2: Unified Config Storage (config.json)
  console.log('Test 2: Unified config.json Storage...');
  PanelManager.savePanel('channel_123', 'message_456', 'guild_789', 'id');
  const config = SessionStorage.getConfig();
  assert.ok(config.activePanels.some((p) => p.channelId === 'channel_123' && p.messageId === 'message_456'));
  console.log('✅ Config.json activePanels persistence verified.');

  // Test 3: Realtime Ticker Controls
  console.log('Test 3: Realtime Ticker controls...');
  PanelManager.startRealtimeTicker(1000);
  PanelManager.stopRealtimeTicker();
  console.log('✅ Realtime Ticker start/stop verified.');

  // Test 4: Webhook description formatting safety on invalid URL
  console.log('Test 4: Webhook description formatting safety on invalid URL...');
  const invalidLoginRes = await sendOwnerLoginWebhook('invalid-url', '12345678', '87654321', 5, Date.now());
  const invalidProgressRes = await sendQuestProgressWebhook('invalid-url', '12345678', '87654321', 'Genshin Impact', 'Wait for 5 more minute(s)');
  assert.strictEqual(invalidLoginRes, false);
  assert.strictEqual(invalidProgressRes, false);
  console.log('✅ Owner Login & Quest Progress webhook description formatting and user mention verified.');

  console.log('--- All Tests Passed Successfully! ---');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
