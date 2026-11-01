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
} = require("discord.js");

// ----------------- CONFIG -----------------
const BREAK_CHANNEL_ID = "1416363610879299717"; // only channel /break can be used in
const APPROVER_ROLE_ID = "1416521000798912677"; // role allowed to approve/deny
const EST_TZ = "America/New_York";
const BREAK_LENGTH_MINUTES = 30;

// In-memory store of pending break requests, keyed by the approval message ID
const pendingBreaks = new Map();

// ----------------- TIME HELPERS -----------------

// Parses a user-entered time string into minutes-since-midnight (0-1439).
// Accepts things like "3:45 PM", "3:45PM", "3pm", "15:45", "0345".
function parseTimeToMinutes(input) {
  if (!input) return null;
  const str = input.trim().toLowerCase().replace(/\s+/g, "");

  const match = str.match(/^(\d{1,2}):?(\d{2})?(am|pm)?$/);
  if (!match) return null;

  let hour = parseInt(match[1], 10);
  const minute = match[2] ? parseInt(match[2], 10) : 0;
  const meridiem = match[3];

  if (minute > 59) return null;

  if (meridiem) {
    if (hour < 1 || hour > 12) return null;
    if (meridiem === "am") {
      hour = hour === 12 ? 0 : hour;
    } else {
      hour = hour === 12 ? 12 : hour + 12;
    }
  } else {
    if (hour < 0 || hour > 23) return null;
  }

  return hour * 60 + minute;
}

function minutesToDisplay(totalMinutes) {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  let hour = Math.floor(normalized / 60);
  const minute = normalized % 60;
  const meridiem = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return `${hour}:${String(minute).padStart(2, "0")} ${meridiem} EST`;
}

// ----------------- MODULE EXPORT -----------------
module.exports = (client, admin) => {
  // ----------------- REGISTER SLASH COMMAND -----------------
  client.once(Events.ClientReady, async () => {
    try {
      const existing = await client.application.commands.fetch();
      if (!existing.some((cmd) => cmd.name === "break")) {
        const command = new SlashCommandBuilder()
          .setName("break")
          .setDescription("Request a break")
          .toJSON();

        await client.application.commands.create(command);
        console.log("Global /break command registered ✅");
      } else {
        console.log("Global /break command already registered ✅");
      }
    } catch (err) {
      console.error("Error registering /break command:", err);
    }
  });

  // ----------------- HANDLE /break -----------------
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== "break") return;

    try {
      // Kill-switch check (only blocks if adminBot explicitly disables "breakBot")
      if (admin && admin.isModuleEnabled && admin.isModuleEnabled("breakBot") === false) {
        return await interaction.reply({ content: "❌ This module is currently disabled.", flags: MessageFlags.Ephemeral });
      }

      // Restrict to the designated channel only
      if (interaction.channelId !== BREAK_CHANNEL_ID) {
        return await interaction.reply({
          content: `❌ This command can only be used in <#${BREAK_CHANNEL_ID}>.`,
          flags: MessageFlags.Ephemeral,
        });
      }

      const modal = new ModalBuilder()
        .setCustomId("breakRequestModal")
        .setTitle("Request a Break");

      const chatterInput = new TextInputBuilder()
        .setCustomId("chatterName")
        .setLabel("Chatter name")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const breakStartInput = new TextInputBuilder()
        .setCustomId("breakStart")
        .setLabel("Break start (EST, e.g. 3:30 PM)")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const netSalesInput = new TextInputBuilder()
        .setCustomId("netSales")
        .setLabel("Net sales")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(chatterInput),
        new ActionRowBuilder().addComponents(breakStartInput),
        new ActionRowBuilder().addComponents(netSalesInput)
      );

      await interaction.showModal(modal);
    } catch (err) {
      console.error("breakBot /break command error:", err);
    }
  });

  // ----------------- HANDLE MODAL SUBMIT -----------------
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isModalSubmit()) return;
    if (interaction.customId !== "breakRequestModal") return;

    try {
      const chatterName = interaction.fields.getTextInputValue("chatterName").trim();
      const breakStartRaw = interaction.fields.getTextInputValue("breakStart").trim();
      const netSalesRaw = interaction.fields.getTextInputValue("netSales").trim();

      const startMinutes = parseTimeToMinutes(breakStartRaw);
      if (startMinutes === null) {
        return await interaction.reply({
          content: "❌ Couldn't understand that break start time. Try a format like `3:30 PM` or `15:30`.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const endMinutes = startMinutes + BREAK_LENGTH_MINUTES;
      const breakStartDisplay = minutesToDisplay(startMinutes);
      const breakEndDisplay = minutesToDisplay(endMinutes);

      const embed = new EmbedBuilder()
        .setTitle("🛑 Break Request - Pending Approval")
        .setColor("Yellow")
        .addFields(
          { name: "Chatter", value: chatterName, inline: true },
          { name: "Net Sales", value: netSalesRaw, inline: true },
          { name: "\u200B", value: "\u200B" },
          { name: "Break Start", value: breakStartDisplay, inline: true },
          { name: "Break End", value: breakEndDisplay, inline: true },
          { name: "Status", value: "⏳ Pending", inline: false }
        )
        .setFooter({ text: `Requested by ${interaction.user.tag}` })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("break_approve").setLabel("Approve").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("break_deny").setLabel("Deny").setStyle(ButtonStyle.Danger)
      );

      const channel = interaction.channel;
      const approvalMessage = await channel.send({
        content: `<@&${APPROVER_ROLE_ID}> approval needed`,
        embeds: [embed],
        components: [row],
      });

      pendingBreaks.set(approvalMessage.id, {
        chatterName,
        netSalesRaw,
        breakStartDisplay,
        breakEndDisplay,
        requestedBy: interaction.user.id,
        status: "pending",
      });

      await interaction.reply({ content: "✅ Break request submitted for approval.", flags: MessageFlags.Ephemeral });
    } catch (err) {
      console.error("breakBot modal submit error:", err);
    }
  });

  // ----------------- HANDLE APPROVE/DENY BUTTONS -----------------
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isButton()) return;
    if (interaction.customId !== "break_approve" && interaction.customId !== "break_deny") return;

    try {
      const record = pendingBreaks.get(interaction.message.id);
      if (!record) {
        return await interaction.reply({ content: "❌ This break request could not be found.", flags: MessageFlags.Ephemeral });
      }

      if (record.status !== "pending") {
        return await interaction.reply({ content: "❌ This break request has already been resolved.", flags: MessageFlags.Ephemeral });
      }

      const member = interaction.member;
      const hasRole = member?.roles?.cache?.has(APPROVER_ROLE_ID);
      if (!hasRole) {
        return await interaction.reply({
          content: "❌ You do not have permission to approve or deny break requests.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const approved = interaction.customId === "break_approve";
      record.status = approved ? "approved" : "denied";

      const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
        .setColor(approved ? "Green" : "Red")
        .setTitle(approved ? "✅ Break Request - Approved" : "🚫 Break Request - Denied")
        .setFields(
          { name: "Chatter", value: record.chatterName, inline: true },
          { name: "Net Sales", value: record.netSalesRaw, inline: true },
          { name: "\u200B", value: "\u200B" },
          { name: "Break Start", value: record.breakStartDisplay, inline: true },
          { name: "Break End", value: record.breakEndDisplay, inline: true },
          {
            name: "Status",
            value: approved
              ? `✅ Approved by ${interaction.user.tag}`
              : `🚫 Denied by ${interaction.user.tag}`,
            inline: false,
          }
        );

      const disabledRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("break_approve")
          .setLabel("Approve")
          .setStyle(ButtonStyle.Success)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId("break_deny")
          .setLabel("Deny")
          .setStyle(ButtonStyle.Danger)
          .setDisabled(true)
      );

      await interaction.update({ embeds: [updatedEmbed], components: [disabledRow] });
    } catch (err) {
      console.error("breakBot approve/deny handler error:", err);
    }
  });
};
