const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

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
  "PURE ENERGY, BITCHES 💪",
  "TOP TIER FLEX, MOTHERFUCKERS 💯",
  "CANNOT BE BEAT, HOLY SHIT 🚀",
  "STAY HYPED, BITCHES 🔥",
  "DOMINATING MODE, MOTHERFUCKERS 😤",
  "STRONGER THAN EVER, HOLY SHIT 💥",
  "THIS IS EPIC, BITCHES 👀",
  "W AFTER W, MOTHERFUCKERS 🏆",
  "THE HYPE NEVER STOPS, HOLY SHIT ⚡",
  "ALL DAY FLEX, BITCHES 💪",
  "CAN YOU HANDLE THIS? MOTHERFUCKERS 😎",
  "LEGEND IN THE MAKING, HOLY SHIT 👑",
  "MAXED OUT ENERGY, BITCHES 💯",
  "VICTORY UNLOCKED, MOTHERFUCKERS 🏁",
  "STRAIGHT SAVAGE, HOLY SHIT 🔥",
  "FLEX SEASON, BITCHES 😤",
  "ALL EYES ON ME, MOTHERFUCKERS 👀",
  "NEXT LEVEL DOMINATION, HOLY SHIT 💥",
  "STAY UNDEFEATED, BITCHES 🏆",
  "PURE HYPE MODE, MOTHERFUCKERS 🚀",
  "THIS IS A BANGER, HOLY SHIT 🔥",
  "TURN UP THE HEAT, BITCHES 💪",
  "CANNOT BE STOPPED, MOTHERFUCKERS ⚡",
  "LEGENDARY FLEX, HOLY SHIT 💯",
  "WE RUN THIS, BITCHES 😎",
  "MAX VIBES, MOTHERFUCKERS 😤",
  "STRAIGHT TO VICTORY, HOLY SHIT 🏁",
  "ON A ROLL, BITCHES 🔥",
  "HOLD THE HYPE, MOTHERFUCKERS 💥",
  "ALL DAY ENERGY, HOLY SHIT ⚡",
  "NEXT W INCOMING, BITCHES 🏆",
  "CANNOT BE MATCHED, MOTHERFUCKERS 😏",
  "TOP FLEX MODE, HOLY SHIT 💪",
  "THIS IS NEXT LEVEL, BITCHES 👀",
  "STRAIGHT ICONIC, MOTHERFUCKERS 🔥",
  "LEGENDS ONLY, HOLY SHIT 💯",
  "THE HYPE IS REAL, BITCHES 💥",
  "DOMINANCE ACHIEVED, MOTHERFUCKERS 🏁",
  "W AFTER W AFTER W, HOLY SHIT 🏆",
  "KEEP THE ENERGY UP, BITCHES ⚡",
  "MAXED OUT FLEX, MOTHERFUCKERS 💪",
  "ALL IN MODE, HOLY SHIT 😎",
  "NEXT LEVEL VIBES, BITCHES 🔥",
  "STAY UNSTOPPABLE, MOTHERFUCKERS 🚀",
  "HYPED UP AND READY, HOLY SHIT 💯",
  "THIS IS HOW WE DO IT, BITCHES 😤",
  "PURE FLEX ENERGY, MOTHERFUCKERS 💥",
  "LOOK AT THIS SKILL, HOLY SHIT 👀",
  "I think I came 😳",
  "Fuck, I'm so hard seeing that",
  "UR GETTING ME WET",
  "LOOK AT THAT BEAUTIFUL WIN",
  "Pookie can I have some more? 🥹 🙏",
  "I wanna suck on that thick fat win",
  "FUCKKK!!!",
  "spank me with those wins 🍆",
  "UR TRYING TO MAKE ME CUM",
  "LETS GET ANOTHER 200 OUT OF HIM!",
  "milk me like u milked that whale 🐳"
];

const HYPE_GIFS = [
 "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExcTl2bWYxbm05a3AxbnBxMWkxNWY1MHZ6MHIxdHgyMGpqMDJzd2YyZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/8JZmEBXoCgDleNWFUt/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcjk3Y2lkMm1id3R0YW1udW9tcWtqdjQ1enRvaHVxazk2ZmNyMnMydiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/b1o4elYH8Tqjm/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcjk3Y2lkMm1id3R0YW1udW9tcWtqdjQ1enRvaHVxazk2ZmNyMnMydiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/FY2ew2Zii9VOE/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcjk3Y2lkMm1id3R0YW1udW9tcWtqdjQ1enRvaHVxazk2ZmNyMnMydiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/266wwviUCMFFgqQGdn/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMXlsbXFoYm1uYjIxcms2ZXNtYWVwbGVjbXM3eG5obGswdXd1bnBuOSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/WsXAEMXxqqQR0tvmq0/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMXlsbXFoYm1uYjIxcms2ZXNtYWVwbGVjbXM3eG5obGswdXd1bnBuOSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/OmGtCYLH9uSd2/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMXlsbXFoYm1uYjIxcms2ZXNtYWVwbGVjbXM3eG5obGswdXd1bnBuOSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/fkD36jhiqzJ9m/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMXlsbXFoYm1uYjIxcms2ZXNtYWVwbGVjbXM3eG5obGswdXd1bnBuOSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/IEqfsVxMDbkWR3LRbI/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMXlsbXFoYm1uYjIxcms2ZXNtYWVwbGVjbXM3eG5obGswdXd1bnBuOSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/RljlDe17ULiTm1alVX/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMXlsbXFoYm1uYjIxcms2ZXNtYWVwbGVjbXM3eG5obGswdXd1bnBuOSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/7ZvPlxBHwfK1y/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMXlsbXFoYm1uYjIxcms2ZXNtYWVwbGVjbXM3eG5obGswdXd1bnBuOSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/OipLlf80joIHbPjyEC/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMXlsbXFoYm1uYjIxcms2ZXNtYWVwbGVjbXM3eG5obGswdXd1bnBuOSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/bg57WaCwp2lji/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3ZzRydWVpbjQ0MDd3emtiM251ZXBvb211b3V6ZDJ5djhudDU4bWJpbyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/Cn5rEZhpu5aPC/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3ZzRydWVpbjQ0MDd3emtiM251ZXBvb211b3V6ZDJ5djhudDU4bWJpbyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/Cn5rEZhpu5aPC/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3ZzRydWVpbjQ0MDd3emtiM251ZXBvb211b3V6ZDJ5djhudDU4bWJpbyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/Cn5rEZhpu5aPC/giphy.gif"
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



