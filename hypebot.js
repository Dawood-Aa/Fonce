const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

const HYPE_REPLIES = [
  "WINS ONLY, BITCH 🔥🔥",
  "look at us flexin’ like maniacs 😎💪",
  "another W? y’all fuckin kidding me? 🏆",
  "keep shitting on the competition 💥",
  "this channel stays undefeated, motherfuckers",
  "THIS IS HOW WE DO IT AT FONCE, BABY",
  "OH MY GOD, STOP IT 😱",
  "STRAIGHT FIRE, NO CAP 🔥",
  "CAN’T STOP US NOW, BITCHES 💣",
  "NEXT LEVEL FLEX, ASSHOLES 😏",
  "ALL DAY, EVERY DAY, FUCK YEAH 💪",
  "WE OUT HERE WINNING, MOTHERFUCKERS 🏆",
  "HYPE BEYOND BELIEF, HOLY SHIT 😤",
  "PURE FUCKIN POWER 💥",
  "UNREAL ENERGY, BABY ⚡",
  "MAJOR FLEX MODE ENGAGED 💯",
  "LEGENDS ONLY, SUCKERS 😎",
  "STRAIGHT TO THE TOP, BITCHES 🏔️",
  "VICTORY LAP, MOTHERFUCKERS 🏁",
  "LOOK AT US GO, HOLY SHIT 👀",
  "CANNOT BE TOUCHED, ASSHOLES ✋",
  "GASSED UP AND FUCKIN READY 🔥",
  "THIS IS A MASTERPIECE, DAMN 🖼️",
  "CAN YOU FEEL IT, BITCHES? ⚡",
  "HOLD ON, WE AIN’T DONE YET 😏",
  "NEXT LEVEL FLEX, MOTHERFUCKERS 💯",
  "STAYING WOKE AND WINNING, SUCKERS 🏆",
  "PEAK PERFORMANCE MODE, BABY 🚀",
  "THE HYPE IS REAL, HOLY SHIT 🔥",
  "STRAIGHT VIBES, BITCH 😤",
  "NO LOSSES ALLOWED, MOTHERFUCKERS ✋",
  "TURNING HEADS EVERYWHERE, ASSHOLES 👀",
  "CANNOT BE STOPPED, HOLY SHIT 💥",
  "ALL IN, ALL WIN, BITCH 💪",
  "MAX LEVEL FLEX, MOTHERFUCKERS 💯",
  "VICTORY TRAIN CHOO CHOO, ASSHOLES 🚂",
  "KEEP THE W'S COMING, BITCHES 🏆",
  "ENERGY OVER 9000, HOLY SHIT ⚡",
  "HYPE TRAIN FULL SPEED, MOTHERFUCKERS 🚄",
  "ON FUCKIN FIRE 🔥",
  "LOOK AT THAT SKILL, BITCHES 😎",
  "NEXT W SECURED, MOTHERFUCKERS 🏁",
  "UNMATCHED, HOLY SHIT 🔥",
  "ALL EYES ON US, ASSHOLES 👀",
  "THE CHAMPIONS ARE HERE, BITCHES 🏆",
  "UNREAL FLEX, MOTHERFUCKERS 💪",
  "TO THE FUCKIN MOON 🚀",
  "THIS IS A MOVEMENT, SUCKERS 💯",
  "PURE DOMINANCE, BITCHES 😤",
  "STRAIGHT HEAT, HOLY SHIT 🔥",
  "CAN’T TOUCH THIS, MOTHERFUCKERS ✋",
  "LEGENDARY STATUS, BITCHES 😎",
  "MAX HYPE, HOLY SHIT 💥",
  "ALL IN ALL WINNING, MOTHERFUCKERS 🏆",
  "THIS IS ICONIC, ASSHOLES 👑",
  "VICTORY VIBES, BITCHES ⚡",
  "HOLD TIGHT, WE WINNING 😏",
  "NEXT W LOADED, HOLY SHIT 🔥",
  "PURE ENERGY, BITCHES 💪"
];

const HYPE_GIFS = [
 "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExcTl2bWYxbm05a3AxbnBxMWkxNWY1MHZ6MHIxdHgyMGpqMDJzd2YyZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/8JZmEBXoCgDleNWFUt/giphy.gif",
 "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcjk3Y2lkMm1id3R0YW1udW9tcWtqdjQ1enRvaHVxazk2ZmNyMnMydiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/b1o4elYH8Tqjm/giphy.gif",
 "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcjk3Y2lkMm1id3R0YW1udW9tcWtqdjQ1enRvaHVxazk2ZmNyMnMydiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/FY2ew2Zii9VOE/giphy.gif"
];

module.exports = (client) => {
  client.on("messageCreate", async message => {
    try {
      if (message.author.bot) return;
      if (message.channel.name !== "🥇wins") return;

      // check if message has an image
      const hasImage = message.attachments.some(att =>
        att.contentType ? att.contentType.startsWith("image/") : att.name?.match(/\.(jpg|jpeg|png|gif)$/i)
      );

      if (!hasImage) return;

      const pool = Math.random() < 0.5 ? HYPE_REPLIES : HYPE_GIFS;
      const reply = pool[Math.floor(Math.random() * pool.length)];

      await message.reply(reply);

    } catch (err) {
      console.error("HypeBot error:", err);
    }
  });
};

