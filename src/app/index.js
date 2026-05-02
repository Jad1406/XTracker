const { init } = require('../clients/whatsAppClient.js');

const config = {
  TARGET_ACCOUNT:    '',
  KEYWORDS:          [''],
  CHECK_INTERVAL_MS: 0.5 * 60 * 1000, // Every minute
  WHATSAPP_GROUP_ID: '',
};

init(config);