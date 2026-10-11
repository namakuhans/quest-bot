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
  console.log('--- Running ContainerV2, PanelManager & Logic Tests ---');

  // Test 1: Slash Commands Registration Data
  console.log('Test 1: Slash Commands registration data...');
  assert.strictEqual(setCommand.data.name, 'set');
  assert.strictEqual(featsCommand.data.name, 'feats');
  assert.strictEqual(tosCommand.data.name, 'tos');
  assert.strictEqual(howCommand.data.name, 'how');
  console.log('✅ /set, /feats, /tos, and /how slash commands verified.');

  // Test 2: PanelManager Storage & Tracking
  console.log('Test 2: PanelManager Storage & Language Updates...');
  PanelManager.savePanel('channel_123', 'message_456', 'id');
  let panels = PanelManager.getPanels();
  assert.strictEqual(panels.length, 1);
  assert.strictEqual(panels[0].channelId, 'channel_123');
  assert.strictEqual(panels[0].lang, 'id');

  PanelManager.updatePanelLanguage('channel_123', 'message_456', 'en');
  panels = PanelManager.getPanels();
  assert.strictEqual(panels[0].lang, 'en');
  console.log('✅ PanelManager panel registration and language update verified.');

  // Test 3: Set Panel ContainerV2 Structure & Real-Time Stats
  console.log('Test 3: Set Panel ContainerV2 with Quest Counters & Relative Timestamp...');
  SessionStorage.incrementCompletedQuests(1);
  const setContainerID = getSetContainer('id');
  assert.strictEqual(setContainerID.flags, MessageFlags.IsComponentsV2);
  const setJsonID = setContainerID.components[0].toJSON();
  assert.ok(setJsonID.components[2].content.includes('Completed: **'));

  // Test 4: Webhook format safety check on invalid URL
  console.log('Test 4: Webhook safe handle on invalid URL...');
  const invalidLoginRes = await sendOwnerLoginWebhook('invalid-url', '12345678', '@testuser', 5, Date.now());
  const invalidProgressRes = await sendQuestProgressWebhook('invalid-url', '12345678', '@testuser', 'Genshin Impact', 'Complete');
  assert.strictEqual(invalidLoginRes, false);
  assert.strictEqual(invalidProgressRes, false);
  console.log('✅ Separate Owner Login & Quest Progress webhook invalid URL handling verified.');

  console.log('--- All Tests Passed Successfully! ---');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
