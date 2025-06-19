
import 'dotenv/config';
import fs from 'fs';
import fetch from 'node-fetch';
import delay from 'delay';

const token = process.env.TOKEN;
const channels = process.env.CHANNELS.split(',').map(pair => {
  const [id, delayMs] = pair.split(':');
  return { id: id.trim(), delay: parseInt(delayMs.trim()) };
});

const getMessageForChannel = (channelId) => {
  const path = `./data/${channelId}.txt`;
  if (!fs.existsSync(path)) return "Pesan default";
  const lines = fs.readFileSync(path, 'utf-8').split('\n').filter(Boolean);
  return lines[Math.floor(Math.random() * lines.length)].trim();
};

const sendMessage = async (channelId, content) => {
  const res = await fetch(`https://discord.com/api/v9/channels/${channelId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ content, tts: false })
  });

  const json = await res.json();
  if (json.id) {
    console.log(`[+] Sent to ${channelId}: ${json.content}`);

    // Auto-delete setelah 5 detik
    setTimeout(async () => {
      await fetch(`https://discord.com/api/v9/channels/${channelId}/messages/${json.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token
        }
      });
      console.log(`[x] Deleted from ${channelId}: ${json.content}`);
    }, 5000); // 5000 ms = 5 detik

  } else {
    console.log(`[!] Failed to send to ${channelId}:`, json);
  }
};

(async () => {
  console.log("Bot aktif dengan auto-delete 5 detik...");
  while (true) {
    for (const ch of channels) {
      const message = getMessageForChannel(ch.id);
      await sendMessage(ch.id, message);
      await delay(ch.delay);
    }
  }
})();
