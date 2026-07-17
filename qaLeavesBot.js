const fs = require("fs");
const path = require("path");
const { Octokit } = require("@octokit/rest");
const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
  Events,
} = require("discord.js");

// ----------------- CONFIG -----------------
const DATA_FILE = path.join(__dirname, "qaleaves.json");

// Only users with this role may use /qaleave
const ALLOWED_ROLE_ID = "1416521000798912677";

// The one and only channel this command works in / posts to
const QA_LEAVE_CHANNEL_ID = "1527468130564051034";

const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_PATH = process.env.QALEAVES_GITHUB_PATH || "qaleaves.json";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

// ----------------- LOAD LEAVES -----------------
let qaLeaves = [];
if (fs.existsSync(DATA_FILE)) {
  qaLeaves = JSON.parse(fs.readFileSync(DATA_FILE));
} else {
  fs.writeFileSync(DATA_FILE, JSON.stringify(qaLeaves, null, 2));
}

// ----------------- SAVE FUNCTION -----------------
async function updateQaLeavesOnGitHub(qaLeaves) {
  try {
    const { data: fileData } = await octokit.repos.getContent({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      path: GITHUB_PATH,
    });

    const content = Buffer.from(JSON.stringify(qaLeaves, null, 2)).toString("base64");

    await octokit.repos.createOrUpdateFileContents({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      path: GITHUB_PATH,
      message: "Update qaleaves.json",
      content,
      sha: fileData.sha,
    });

    console.log("qaleaves.json synced to GitHub ✅");
  } catch (err) {
    console.error("Failed to sync qaleaves.json to GitHub:", err);
  }
}

async function saveQaLeaves() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(qaLeaves, null, 2));
  await updateQaLeavesOnGitHub(qaLeaves);
}

// ----------------- MODULE EXPORT -----------------
module.exports = (client, admin) => {
  // ----------------- REGISTER SLASH COMMAND -----------------
  client.once(Events.ClientReady, async () => {
    try {
      const existing = await client.application.commands.fetch();
      if (!existing.some((cmd) => cmd.name === "qaleave")) {
        const command = new SlashCommandBuilder()
          .setName("qaleave")
          .setDescription("Submit a QA leave request")
          .toJSON();

        await client.application.commands.create(command);
        console.log("Global /qaleave command registered ✅");
      } else {
        console.log("Global /qaleave command already registered ✅");
      }
    } catch (err) {
      console.error("Error registering /qaleave command:", err);
    }
  });

  // ----------------- HANDLE SLASH COMMAND -----------------
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== "qaleave") return;

    // Restrict to the QA leave channel only
    if (interaction.channelId !== QA_LEAVE_CHANNEL_ID) {
      return interaction.reply({
        content: `❌ This command can only be used in <#${QA_LEAVE_CHANNEL_ID}>.`,
        ephemeral: true,
      });
    }

    // Restrict to the allowed role only
    if (!interaction.member.roles.cache.has(ALLOWED_ROLE_ID)) {
      return interaction.reply({
        content: "❌ You don't have permission to use this command.",
        ephemeral: true,
      });
    }

    const modal = new ModalBuilder()
      .setCustomId("qaLeaveModal")
      .setTitle("Submit QA Leave Request");

    const nameInput = new TextInputBuilder()
      .setCustomId("name")
      .setLabel("Your Name")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const dateInput = new TextInputBuilder()
      .setCustomId("dates")
      .setLabel("Date(s) (comma separated, MM/DD/YYYY)")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const shiftInput = new TextInputBuilder()
      .setCustomId("shift")
      .setLabel("Shift")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const reasonInput = new TextInputBuilder()
      .setCustomId("reason")
      .setLabel("Reason")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(nameInput),
      new ActionRowBuilder().addComponents(dateInput),
      new ActionRowBuilder().addComponents(shiftInput),
      new ActionRowBuilder().addComponents(reasonInput)
    );

    await interaction.showModal(modal);
  });

  // ----------------- HANDLE MODAL SUBMIT -----------------
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isModalSubmit()) return;
    if (interaction.customId !== "qaLeaveModal") return;

    const name = interaction.fields.getTextInputValue("name");
    const dates = interaction.fields
      .getTextInputValue("dates")
      .split(",")
      .map((d) => d.trim());

    const shift = interaction.fields.getTextInputValue("shift");
    const reason = interaction.fields.getTextInputValue("reason");

    await interaction.reply({ content: "QA leave request submitted ✅", ephemeral: true });

    const qaChannel = await interaction.guild.channels
      .fetch(QA_LEAVE_CHANNEL_ID)
      .catch(() => null);

    if (!qaChannel) {
      console.log("QA leave channel not found");
      await interaction.followUp({
        content: "❌ QA leave channel not found.",
        ephemeral: true,
      });
      return;
    }

    for (const date of dates) {
      const embed = new EmbedBuilder()
        .setTitle("QA Leave Request")
        .setColor("Green")
        .addFields(
          { name: "QA Member", value: name, inline: true },
          { name: "Date", value: date, inline: true },
          { name: "Shift", value: shift, inline: true },
          { name: "Reason", value: reason }
        )
        .setFooter({ text: "Status: Approved" });

      const claimRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`claim_${interaction.user.id}_${date}`)
          .setLabel("Claim")
          .setStyle(ButtonStyle.Primary)
      );

      await qaChannel.send({
        embeds: [embed],
        components: [claimRow],
      });

      qaLeaves.push({
        userId: interaction.user.id,
        name,
        date,
        shift,
        reason,
        status: "Approved",
        claimedBy: null,
        timestamp: new Date().toISOString(),
      });

      await saveQaLeaves();
    }
  });

  // ----------------- HANDLE CLAIM BUTTON -----------------
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isButton()) return;

    const [action, userId, date] = interaction.customId.split("_");
    if (action !== "claim") return;

    // Only act on claims coming from the QA leave channel
    if (interaction.channelId !== QA_LEAVE_CHANNEL_ID) return;

    const qaLeave = qaLeaves.find((l) => l.userId === userId && l.date === date);
    // If this claim doesn't correspond to a QA leave entry, let another handler deal with it
    if (!qaLeave) return;

    const embed = EmbedBuilder.from(interaction.message.embeds[0]);
    embed
      .setFooter({ text: `Status: Claimed by ${interaction.user.username}` })
      .setColor("Yellow");

    qaLeave.claimedBy = interaction.user.id;
    await saveQaLeaves();

    await interaction.update({ embeds: [embed], components: [] });
  });
};
