const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode                = require('qrcode-terminal');
const { fetchAndFilter }    = require('./nitterClient.js');

function init(config) {
  const { TARGET_ACCOUNT, KEYWORDS, CHECK_INTERVAL_MS, WHATSAPP_GROUP_ID } = config;

  const waClient = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox'] }
  });

  waClient.on('qr', qr => {
    console.log('\n📱 Scan this QR code with WhatsApp on your phone:\n');
    qrcode.generate(qr, { small: true });
  });

  waClient.on('authenticated', () => {
    console.log('✅ WhatsApp authenticated!');
  });

  waClient.on('ready', async () => {
    console.log('✅ WhatsApp client ready!\n');
    console.log(`🔍 Monitoring @${TARGET_ACCOUNT} for: ${KEYWORDS.join(', ')}`);
    console.log(`⏱  Checking every ${CHECK_INTERVAL_MS / 60000} minutes\n`);
    console.log(`📤 Sending to group ID: ${WHATSAPP_GROUP_ID}\n`);

    await fetchAndFilter(waClient, WHATSAPP_GROUP_ID, config);
    setInterval(() => fetchAndFilter(waClient, WHATSAPP_GROUP_ID, config), CHECK_INTERVAL_MS);
  });

  waClient.on('disconnected', reason => {
    console.warn('⚠️  WhatsApp disconnected:', reason);
  });

  waClient.initialize();
}

module.exports = { init };
