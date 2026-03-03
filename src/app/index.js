const { init } = require('../clients/whatsAppClient.js');

const config = {
  TARGET_ACCOUNT:    '', // X account
  KEYWORDS:          [''], // Keywords for filtering messages
  CHECK_INTERVAL_MS: 0.05 * 60 * 1000, // Every minute
  WHATSAPP_GROUP_ID: '', // WhatsApp group ID. Check README.md for details
};

init(config);
