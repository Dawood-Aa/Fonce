const {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  Events,
  MessageFlags,
  escapeMarkdown,
} = require("discord.js");

// ----------------- CONFIG -----------------
const DUCK_CHANNEL_ID = null;     // set to a channel ID to restrict /duckrace to one channel (null = anywhere)
const ALLOWED_ROLE_IDS = ["1416521000798912677"]; // only these roles can host races (empty = anyone)

const WIPEOUT_CHANCE = 0.05;   // chance each duck gets wiped out during a race

const MIN_DUCKS = 2;
const MAX_DUCKS = 12;
const MAX_NAME_LENGTH = 20;       // max characters per duck name
const LANE_NAME_LENGTH = 14;      // names are shortened to this in the race lanes

const TRACK_LENGTH = 10;          // water cells before the finish line
const FRAME_MS = 1400;            // delay between race frames (keep >= ~1.2s to respect Discord edit limits)
const COUNTDOWN_MS = 1000;
const BUTTON_TIMEOUT_MS = 10 * 60 * 1000; // rematch buttons disappear after this long

const COLOR_RACE = 0x3498db;
const COLOR_READY = 0x95a5a6;
const COLOR_GO = 0x2ecc71;
const COLOR_FINISH = 0xf1c40f;

// Channels with a race currently running, and rematch sessions keyed by result message ID
const activeChannels = new Set();
const sessions = new Map();

// ----------------- HELPERS -----------------
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function shortName(name) {
  const trimmed = name.length > LANE_NAME_LENGTH ? `${name.slice(0, LANE_NAME_LENGTH - 1)}…` : name;
  return escapeMarkdown(trimmed);
}

function parseDucks(raw) {
  const names = raw
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean);

  if (names.length < MIN_DUCKS) {
    return { error: `❌ You need at least **${MIN_DUCKS}** ducks to have a race. Separate the names with commas.` };
  }
  if (names.length > MAX_DUCKS) {
    return { error: `❌ Maximum is **${MAX_DUCKS}** ducks, you entered **${names.length}**.` };
  }

  const tooLong = names.filter((n) => n.length > MAX_NAME_LENGTH);
  if (tooLong.length) {
    return {
      error: `❌ Keep duck names to ${MAX_NAME_LENGTH} characters or less: ${tooLong
        .map((n) => `**${escapeMarkdown(n)}**`)
        .join(", ")}`,
    };
  }

  const seen = new Set();
  const dupes = [];
  for (const n of names) {
    const key = n.toLowerCase();
    if (seen.has(key)) dupes.push(n);
    seen.add(key);
  }
  if (dupes.length) {
    return {
      error: `❌ Every duck needs a unique name. Duplicates: ${dupes
        .map((n) => `**${escapeMarkdown(n)}**`)
        .join(", ")}`,
    };
  }

  return { ducks: names };
}

// ----------------- COMMENTARY -----------------
// {name} is replaced with the duck's name. Add or edit lines freely.
const BOOST_LINES = [
  "🚀 {name} runs after free porn and is boosted!",
  "🚀 {name} gets a gooning powerup!",
  "🚀 {name} bribed the judge with a handjob!",
  "🚀 {name} spotted a whale and got a massive tip boost!",
  "🚀 {name} popped a blue pill and is rocketing ahead!",
  "🚀 {name} caught a wave of simps and surges forward!",
];

const STALL_LINES = [
  "🐌 {name} got stuck in a pair of Sally's panties!",
  "🐌 {name} took a detour to sniff Heather's ass!",
  "🐌 {name} stopped to take a thirst trap selfie for Micka!",
  "🐌 {name} got distracted replying to Kat's DMs!",
  "🐌 {name} got caught gooning in the reeds!",
  "🐌 {name} stopped to check if the whale replied!",
  "🐌 {name} got distracted by a wet t-shirt contest on the shore!",
];

const WIPEOUT_LINES = [
  "💀 {name} stopped to hook up with Lexxi. WIPED OUT!",
  "💀 {name} got mauled by a feral cat. WIPED OUT!",
  "💀 {name} drowned lmfao. WIPED OUT!",
  "💀 {name} got sat on by a 300 lb whale(heather). WIPED OUT!",
  "💀 {name} choked on a mystery pill from the water. WIPED OUT!",
  "💀 {name} got banned mid-race and escorted off the track. WIPED OUT!",
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const line = (template, racer) => template.replace("{name}", `**${shortName(racer.name)}**`);

// ----------------- RACE SIMULATION -----------------
// The whole race is simulated up front, then played back frame by frame.
// The race runs until every duck has either finished or been wiped out.
function simulateRace(names) {
  const racers = names.map((name, i) => ({
    name,
    lane: i + 1,
    pos: 0,
    place: null,
    dead: false,
    dieAt: null,
  }));

  // Each duck has a WIPEOUT_CHANCE of dying somewhere along the track
  for (const r of racers) {
    if (Math.random() < WIPEOUT_CHANCE) r.dieAt = 1.5 + Math.random() * (TRACK_LENGTH - 3);
  }
  // There must always be at least one survivor so there is a winner
  if (racers.every((r) => r.dieAt !== null)) {
    racers[Math.floor(Math.random() * racers.length)].dieAt = null;
  }

  const frames = [];
  let finishedCount = 0;
  let winner = null;
  let leaderName = null;

  for (let tick = 1; tick <= 400 && racers.some((r) => r.place === null && !r.dead); tick++) {
    const notes = [];
    // Once there is a winner the rest of the field hurries up so the race wraps quickly
    const rush = winner ? 2 : 1;

    for (const r of racers) {
      if (r.place !== null || r.dead) continue;

      let speed = 0.2 + Math.random() * 0.5;
      if (!winner) {
        const roll = Math.random();
        if (roll < 0.1) {
          speed += 0.7;
          notes.push({ priority: 1, text: line(pick(BOOST_LINES), r) });
        } else if (roll < 0.18) {
          speed = 0;
          notes.push({ priority: 1, text: line(pick(STALL_LINES), r) });
        }
      }
      r.pos += speed * rush;

      if (r.dieAt !== null && r.pos >= r.dieAt) {
        r.dead = true;
        r.pos = r.dieAt;
        notes.push({ priority: 3, text: line(pick(WIPEOUT_LINES), r) });
      }
    }

    // Anyone who crossed the line this tick (furthest past the line wins ties)
    const crossers = racers
      .filter((r) => r.place === null && !r.dead && r.pos >= TRACK_LENGTH)
      .sort((a, b) => b.pos - a.pos);

    for (const r of crossers) {
      finishedCount++;
      r.place = finishedCount;
      if (finishedCount === 1) {
        winner = r;
        let text = `🏁 **${shortName(r.name)}** CROSSES THE LINE FIRST AND WINS THE RACE!`;
        if (crossers.length >= 2 && r.pos - crossers[1].pos < 0.3) {
          text += " 📸 PHOTO FINISH!";
        }
        notes.push({ priority: 5, text });
      } else {
        notes.push({ priority: 1, text: `🏁 **${shortName(r.name)}** finally crosses the line.` });
      }
    }

    // Lead change (only matters before there's a winner)
    if (!winner) {
      const running = racers.filter((r) => r.place === null && !r.dead);
      if (running.length) {
        const leader = running.reduce((a, b) => (b.pos > a.pos ? b : a));
        if (leader.name !== leaderName && tick >= 3) {
          notes.push({ priority: 2, text: `👑 **${shortName(leader.name)}** takes the lead!` });
        }
        leaderName = leader.name;
      }
    }

    // One highlight per frame: highest priority, random among ties
    let note = null;
    if (notes.length) {
      const top = Math.max(...notes.map((n) => n.priority));
      const pool = notes.filter((n) => n.priority === top);
      note = pool[Math.floor(Math.random() * pool.length)].text;
    }

    frames.push({
      racers: racers.map((r) => ({
        name: r.name,
        lane: r.lane,
        pos: r.pos,
        place: r.place,
        dead: r.dead,
      })),
      note,
    });
  }

  return { frames, winner: winner ? winner.name : racers[0].name };
}

// ----------------- RENDERING -----------------
function renderLane(r) {
  const slot = Math.min(Math.floor(r.pos), TRACK_LENGTH);
  const icon = r.dead ? "💀" : "🦆";
  let track = "";
  for (let i = 0; i < TRACK_LENGTH; i++) track += i === slot ? icon : "🌊";
  track += slot === TRACK_LENGTH ? icon : "🏁";

  const crown = r.place === 1 ? " 🏆" : "";
  const label = `\`${String(r.lane).padStart(2, "0")}\``;
  return `${label} ${track}${crown} **${shortName(r.name)}**`;
}

function renderLanes(racers) {
  return racers.map(renderLane).join("\n");
}

function lineupRacers(ducks) {
  return ducks.map((name, i) => ({ name, lane: i + 1, pos: 0, place: null, dead: false }));
}

function buildEmbed({ title, color, racers, fieldName, fieldValue, footer }) {
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setColor(color)
    .setDescription(renderLanes(racers));
  if (fieldName) embed.addFields({ name: fieldName, value: fieldValue || "…" });
  if (footer) embed.setFooter({ text: footer });
  return embed;
}

// ----------------- RACE RUNNER -----------------
async function runRace(channel, host, ducks) {
  activeChannels.add(channel.id);
  let msg = null;

  try {
    const { frames, winner } = simulateRace(ducks);
    const footer = `Hosted by ${host.username}`;

    // Line-up
    msg = await channel.send({
      embeds: [
        buildEmbed({
          title: "🦆 DUCK RACE 🦆",
          color: COLOR_READY,
          racers: lineupRacers(ducks),
          fieldName: "🚦 Ducks, take your positions!",
          fieldValue: `**${ducks.length}** ducks are on the starting line...`,
          footer,
        }),
      ],
    });
    await sleep(2000);

    // Countdown
    for (const step of ["3…", "2…", "1…"]) {
      await msg.edit({
        embeds: [
          buildEmbed({
            title: "🦆 DUCK RACE 🦆",
            color: COLOR_READY,
            racers: lineupRacers(ducks),
            fieldName: "🚦 Get ready!",
            fieldValue: `**${step}**`,
            footer,
          }),
        ],
      });
      await sleep(COUNTDOWN_MS);
    }

    // Race
    const commentary = ["🔔 **QUACK!** And they're off!"];
    await msg.edit({
      embeds: [
        buildEmbed({
          title: "🦆 DUCK RACE 🦆",
          color: COLOR_GO,
          racers: lineupRacers(ducks),
          fieldName: "📣 Live Commentary",
          fieldValue: commentary.join("\n"),
          footer,
        }),
      ],
    });
    await sleep(FRAME_MS);

    for (const frame of frames) {
      if (frame.note) {
        commentary.push(frame.note);
        if (commentary.length > 3) commentary.shift();
      }
      await msg.edit({
        embeds: [
          buildEmbed({
            title: "🦆 DUCK RACE 🦆",
            color: COLOR_RACE,
            racers: frame.racers,
            fieldName: "📣 Live Commentary",
            fieldValue: commentary.join("\n"),
            footer,
          }),
        ],
      });
      await sleep(FRAME_MS);
    }

    // Results
    const finalRacers = frames[frames.length - 1].racers;
    const results = new EmbedBuilder()
      .setTitle("🏆 DUCK RACE WINNER 🏆")
      .setColor(COLOR_FINISH)
      .setDescription(renderLanes(finalRacers))
      .addFields({ name: "🥇 Winner", value: `**${escapeMarkdown(winner)}**` })
      .setFooter({ text: `${footer} • Congratulations, ${winner}!` })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("duck_rematch").setLabel("Rematch").setEmoji("🔁").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("duck_newducks").setLabel("New Ducks").setEmoji("🦆").setStyle(ButtonStyle.Secondary)
    );

    await msg.edit({ embeds: [results], components: [row] });

    sessions.set(msg.id, { ducks, hostId: host.id });
    const timer = setTimeout(() => {
      sessions.delete(msg.id);
      msg.edit({ components: [] }).catch(() => null);
    }, BUTTON_TIMEOUT_MS);
    timer.unref?.();
  } catch (err) {
    console.error("duckBot race error:", err);
    await channel.send("⚠️ The duck race was interrupted. Something went wrong with the pond.").catch(() => null);
  } finally {
    activeChannels.delete(channel.id);
  }
}

// Finds the channel and confirms the bot can actually post embeds in it
async function getUsableChannel(interaction) {
  const channel =
    interaction.channel ?? (await interaction.client.channels.fetch(interaction.channelId).catch((err) => {
      console.error(`duckBot: could not fetch channel ${interaction.channelId}:`, err.message);
      return null;
    }));
  if (!channel || typeof channel.send !== "function") return null;

  if (channel.guild && channel.permissionsFor && interaction.client.user) {
    const perms = channel.permissionsFor(interaction.client.user);
    if (perms && !perms.has(["ViewChannel", "SendMessages", "EmbedLinks"])) {
      const missing = perms.missing(["ViewChannel", "SendMessages", "EmbedLinks"]);
      console.error(`duckBot: missing permissions in #${channel.name}: ${missing.join(", ")}`);
      return null;
    }
  }
  return channel;
}

// ----------------- MODULE EXPORT -----------------
module.exports = (client, admin) => {
  const isDisabled = () => admin && admin.isModuleEnabled && admin.isModuleEnabled("duckBot") === false;

  const canHost = (member) =>
    ALLOWED_ROLE_IDS.length === 0 || member?.roles?.cache?.some((r) => ALLOWED_ROLE_IDS.includes(r.id));

  function buildModal() {
    const modal = new ModalBuilder().setCustomId("duckRaceModal").setTitle("🦆 Duck Race Setup");

    const duckInput = new TextInputBuilder()
      .setCustomId("ducks")
      .setLabel(`Duck names (comma separated, max ${MAX_DUCKS})`)
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder("Quackers, Sir Waddles, Duck Norris, Beyoncé...")
      .setMaxLength(1000)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(duckInput));
    return modal;
  }

  // ----------------- REGISTER SLASH COMMAND -----------------
  client.once(Events.ClientReady, async () => {
    try {
      const existing = await client.application.commands.fetch();
      if (!existing.some((cmd) => cmd.name === "duckrace")) {
        const command = new SlashCommandBuilder()
          .setName("duckrace")
          .setDescription("Host an animated duck race")
          .toJSON();
        await client.application.commands.create(command);
        console.log("Global /duckrace command registered ✅");
      } else {
        console.log("Global /duckrace command already registered ✅");
      }
    } catch (err) {
      console.error("Error registering /duckrace command:", err);
    }
  });

  // ----------------- HANDLE /duckrace -----------------
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== "duckrace") return;

    try {
      if (isDisabled()) {
        return await interaction.reply({ content: "❌ This module is currently disabled.", flags: MessageFlags.Ephemeral });
      }
      if (DUCK_CHANNEL_ID && interaction.channelId !== DUCK_CHANNEL_ID) {
        return await interaction.reply({
          content: `❌ Duck races can only be hosted in <#${DUCK_CHANNEL_ID}>.`,
          flags: MessageFlags.Ephemeral,
        });
      }
      if (!canHost(interaction.member)) {
        return await interaction.reply({
          content: "❌ You don't have permission to host duck races.",
          flags: MessageFlags.Ephemeral,
        });
      }
      if (activeChannels.has(interaction.channelId)) {
        return await interaction.reply({
          content: "🦆 A race is already in progress in this channel. Wait for it to finish!",
          flags: MessageFlags.Ephemeral,
        });
      }

      await interaction.showModal(buildModal());
    } catch (err) {
      console.error("duckBot /duckrace error:", err);
    }
  });

  // ----------------- HANDLE MODAL SUBMIT -----------------
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isModalSubmit()) return;
    if (interaction.customId !== "duckRaceModal") return;

    try {
      if (isDisabled()) {
        return await interaction.reply({ content: "❌ This module is currently disabled.", flags: MessageFlags.Ephemeral });
      }

      if (!canHost(interaction.member)) {
        return await interaction.reply({
          content: "❌ You don't have permission to host duck races.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const { ducks, error } = parseDucks(interaction.fields.getTextInputValue("ducks"));
      if (error) {
        return await interaction.reply({ content: error, flags: MessageFlags.Ephemeral });
      }

      if (activeChannels.has(interaction.channelId)) {
        return await interaction.reply({
          content: "🦆 A race is already in progress in this channel. Wait for it to finish!",
          flags: MessageFlags.Ephemeral,
        });
      }

      const channel = await getUsableChannel(interaction);
      if (!channel) {
        return await interaction.reply({
          content:
            "❌ I can't post in this channel. Give the bot **View Channel**, **Send Messages**, **Embed Links** and **Read Message History** here, then try again.",
          flags: MessageFlags.Ephemeral,
        });
      }

      await interaction.reply({ content: "🦆 The ducks are lining up...", flags: MessageFlags.Ephemeral });
      runRace(channel, interaction.user, ducks);
    } catch (err) {
      console.error("duckBot modal submit error:", err);
    }
  });

  // ----------------- HANDLE RESULT BUTTONS -----------------
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isButton()) return;
    if (interaction.customId !== "duck_rematch" && interaction.customId !== "duck_newducks") return;

    try {
      if (isDisabled()) {
        return await interaction.reply({ content: "❌ This module is currently disabled.", flags: MessageFlags.Ephemeral });
      }

      const session = sessions.get(interaction.message.id);
      if (!session) {
        return await interaction.reply({
          content: "❌ This race has expired. Use `/duckrace` to start a new one.",
          flags: MessageFlags.Ephemeral,
        });
      }

      if (interaction.user.id !== session.hostId && !canHost(interaction.member)) {
        return await interaction.reply({
          content: "❌ Only the host can start another race.",
          flags: MessageFlags.Ephemeral,
        });
      }

      if (activeChannels.has(interaction.channelId)) {
        return await interaction.reply({
          content: "🦆 A race is already in progress in this channel.",
          flags: MessageFlags.Ephemeral,
        });
      }

      if (interaction.customId === "duck_newducks") {
        return await interaction.showModal(buildModal());
      }

      // Rematch: same ducks, new race
      sessions.delete(interaction.message.id);
      await interaction.update({ components: [] });

      const channel = await getUsableChannel(interaction);
      if (channel) runRace(channel, interaction.user, session.ducks);
    } catch (err) {
      console.error("duckBot button error:", err);
    }
  });
};
