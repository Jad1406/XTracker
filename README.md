# WhatsApp News Bot — Setup Guide

Monitors any account on X and forwards tweets mentioning
custom tags to your WhatsApp group.

---

## 1. Prerequisites

- [Node.js](https://nodejs.org/) v18 or newer
- A phone with WhatsApp (must stay online/connected)

---

## 2. Get Your WhatsApp Group ID

The bot uses your group's ID directly — no chat sync needed.

**One-time setup to find your group ID:**

Temporarily add this inside `waClient.on('ready', async () => { ... })`, run the bot once, then remove it:

```js
const chats = await waClient.getChats();
chats.filter(c => c.isGroup).forEach(g => console.log(g.name, '→', g.id._serialized));
```

Copy the ID ending in `@g.us` for your target group.

---

## 3. Configure the Bot

Open `index.js` and update these two lines at the top:

```js
const config = {
  TARGET_ACCOUNT:    '', // X account
  KEYWORDS:          [''], // Keywords for filtering messages
  CHECK_INTERVAL_MS: 0.05 * 60 * 1000, // Every minute
  WHATSAPP_GROUP_ID: '', // WhatsApp group ID. Check README.md for details
};
```

---

## 3. Install & Run

```bash
# Install dependencies
npm install

# Start the bot
npm start
```

On first run, a **QR code** will appear in the terminal.
Open WhatsApp on your phone → Linked Devices → Link a Device → scan the QR.

The bot will then:

- Check TARGET_ACCOUNT account every CHECK_INTERVAL_MS milliseconds
- Forward any tweet containing KEYWORDS to your group

---

## 4. Keep It Running (Optional - Not yet tested)

To run it in the background (so it keeps going after you close the terminal):

```bash
# Install pm2 globally
npm install -g pm2

# Start with pm2
pm2 start index.js --name news-bot

# Auto-restart on reboot
pm2 startup
pm2 save
```

---

## Notes

- Your WhatsApp session is saved in `.wwebjs_auth/` so you won't need to scan the QR again after the first time
- The bot only picks up **original tweets** (retweets and replies are excluded)