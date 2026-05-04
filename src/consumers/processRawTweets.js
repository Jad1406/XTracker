// TODO: Reduce function complexity
async function filterRawTweet(rawTweet) {
  const { TARGET_ACCOUNT, KEYWORDS, CHECK_INTERVAL_MS } = config;

  console.log(`[${new Date().toLocaleTimeString()}] Checking @${TARGET_ACCOUNT} for new tweets...`);

  try {
    const items   = await fetchRSS(TARGET_ACCOUNT);
    const sentIds = loadPrevSentIds();

    // Send new valid messages in reverse order of time
    // const toSend = items
    //   .slice()
    //   .reverse()
    //   .filter(item => {
    //     const id      = extractTweetId(item.link);
    //     const pubDate = item.pubDate;
    //     const text    = stripHtml(item.description || item.title || '');

    //     if (!isRecent(pubDate, CHECK_INTERVAL_MS)) {
    //       console.log(`⏩ Skipping ${id} — not posted in the last ${CHECK_INTERVAL_MS / (60 * 1000)} mins.`);
    //       return false;
    //     }
    //     if (sentIds.has(id)) {
    //       console.log(`⏩ Skipping ${id} — already sent.`);
    //       return false;
    //     }
    //     if (!matchesFilter(text, KEYWORDS)) {
    //       console.log(`⏩ Skipping ${id} — no keyword match.`);
    //       return false;
    //     }
    //     return true;
    //   });

    // if (toSend.length === 0) {
    //   console.log('No new matching tweets to send.');
    //   return;
    // }

    console.log("All Items")
    console.log(items)
    for (const item of items) {
      // const id   = extractTweetId(item.link);
      // const text = stripHtml(item.description || item.title || '');
      // const link = toXLink(item.link);
      // const msg  = formatMessage(text, link);

      // await waClient.sendMessage(groupChatId, msg);
      console.log(item)
      // sentIds.add(id);
      // console.log(`✅ Sent tweet ${id} to WhatsApp group.`);
      await new Promise(r => setTimeout(r, 2000));
    }

    // saveSentIds(sentIds);

  } catch (err) {
    console.error('Error fetching tweets:', err.message || err);
  }
}