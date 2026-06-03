const { Client, LocalAuth }     = require('whatsapp-web.js');
const qrcode                    = require('qrcode-terminal');
const { consumeFilteredTweets } = require('../consumers/filteredTweets.js')

let whatsappGroups = []
const defaultGroupID = '' // temp value

function init(groupsToSendTo) {
  const waClient = newWAClient();

  waClient.on('qr', qr => {
    console.log('\n📱 Scan this QR code with WhatsApp on your phone:\n');
    qrcode.generate(qr, { small: true });
  });

  // Find group IDs
  // TODO: Cache with redis
  async () => {
    await fetchGroupIDs(waClient, groupsToSendTo);
  }

  // TODO: Implement error handling on empty list
  if (whatsappGroups.length === 0) {
    whatsappGroups.push(defaultGroupID);
  }

  waClient.on('authenticated', () => {
    console.log('✅ WhatsApp authenticated!');
  });

  waClient.on('ready', async () => {
    console.log('✅ WhatsApp client ready!\n');
    console.log(`📤 Sending to group ID: ${whatsappGroups.join(', ')}\n`);

    await consumeFilteredTweets(waClient, whatsappGroups);
  });

  waClient.on('disconnected', reason => {
    console.warn('⚠️  WhatsApp disconnected:', reason);
  });

  waClient.initialize();
}

function newWAClient() {
  return new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox'] }
  });
}

async function fetchGroupIDs(waClient, groupsToSendTo) { 
  const chats = await waClient.getChats();
  chats.filter(c => c.isGroup).forEach(g => {
    if(groupsToSendTo.includes(g.name)) {
      whatsappGroups.push(g.id._serialized)
    }
  });
}

module.exports = { init };