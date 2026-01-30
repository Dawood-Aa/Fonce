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
  try {
    if (message.author.bot) return;
    if (message.channel.name !== "wins") return;

    // check attachments safely
    const hasImage = message.attachments.some(att =>
      att.contentType ? att.contentType.startsWith("image/") : att.name?.match(/\.(jpg|jpeg|png|gif)$/i)
    );

    if (!hasImage) return;

    const pool = Math.random() < 0.5 ? HYPE_REPLIES : HYPE_GIFS;
    const reply = pool[Math.floor(Math.random() * pool.length)];

    await message.reply(reply);
  } catch (err) {
    console.error("Error handling message:", err);
  }
});

client.login(process.env.BOT_TOKEN);
