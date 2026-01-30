const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const HYPE_REPLIES = [
  "WINS ONLY 🔥🔥",
  "nah this is a flex 😮‍💨",
  "another W added to the board 🏆",
  "keep cooking 💪",
  "this channel stays undefeated"
];

const HYPE_GIFS = [
  "https://media.giphy.com/media/3o6Zt481isNVuQI1l6/giphy.gif",
  "https://media.giphy.com/media/l0HlFZ3c4NENSLQRi/giphy.gif",
  "https://media.giphy.com/media/xUPGcgtKxm9G7s7Vfi/giphy.gif"
];

client.on("messageCreate", async message => {
  if (message.author.bot) return;
  if (message.channel.name !== "wins") return;

  const hasImage = message.attachments.some(att =>
    att.contentType?.startsWith("image/")
  );

  if (!hasImage) return;

  const pool = Math.random() < 0.5 ? HYPE_REPLIES : HYPE_GIFS;
  const reply = pool[Math.floor(Math.random() * pool.length)];

  await message.reply(reply);
});

client.login(process.env.BOT_TOKEN);
