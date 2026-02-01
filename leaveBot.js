const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
} = require("discord.js");

module.exports = (client) => {
  // REGISTER SLASH COMMAND
  client.once("ready", async () => {
    try {
      const data = [
        new SlashCommandBuilder()
          .setName("leave")
          .setDescription("Submit a leave request")
      ].map(cmd => cmd.toJSON());

      const guild = client.guilds.cache.get(process.env.GUILD_ID); // target your server
      if (!guild) return console.log("No guild found");

      await guild.commands.set(data);
      console.log("Leave command registered for your server ✅");
    } catch (err) {
      console.error("Error registering leave command:", err);
    }
  });

  // HANDLE SLASH COMMAND
  client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== "leave") return;

    // Create modal
    const modal = new ModalBuilder()
      .setCustomId("leaveModal")
      .setTitle("Submit Leave Request");

    const nameInput = new TextInputBuilder()
      .setCustomId("name")
      .setLabel("Your Name")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const dateInput = new TextInputBuilder()
      .setCustomId("dates")
      .setLabel("Date(s) (comma separated if multiple)")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const shiftInput = new TextInputBuilder()
      .setCustomId("shift")
      .setLabel("Shift")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const modelsInput = new TextInputBuilder()
      .setCustomId("models")
      .setLabel("Models affected")
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
      new ActionRowBuilder().addComponents(modelsInput),
      new ActionRowBuilder().addComponents(reasonInput)
    );

    await interaction.showModal(modal);
  });

  // HANDLE MODAL SUBMISSION
  client.on("interactionCreate", async interaction => {
    if (!interaction.isModalSubmit()) return;
    if (interaction.customId !== "leaveModal") return;

    const name = interaction.fields.getTextInputValue("name");
    const dates = interaction.fields.getTextInputValue("dates")
      .split(",")
      .map(d => d.trim());
    const shift = interaction.fields.getTextInputValue("shift");
    const models = interaction.fields.getTextInputValue("models");
    const reason = interaction.fields.getTextInputValue("reason");

    await interaction.reply({ content: "Leave request submitted ✅", ephemeral: true });

    const leaveChannel = interaction.guild.channels.cache.find(ch => ch.name === "⚖️qa-general⚖️");
    if (!leaveChannel) return console.log("Leave channel not found");

    for (const date of dates) {
      const embed = new EmbedBuilder()
        .setTitle("Leave Request")
        .setColor("Yellow")
        .addFields(
          { name: "Chatter", value: name, inline: true },
          { name: "Date", value: date, inline: true },
          { name: "Shift", value: shift, inline: true },
          { name: "Models", value: models },
          { name: "Reason", value: reason }
        )
        .setFooter({ text: "Status: Pending" });

      const buttons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`approve_${interaction.user.id}_${date}`)
            .setLabel("Approve")
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`decline_${interaction.user.id}_${date}`)
            .setLabel("Decline")
            .setStyle(ButtonStyle.Danger)
        );

      await leaveChannel.send({ embeds: [embed], components: [buttons] });
    }
  });

  // HANDLE BUTTONS (approve/decline/claim)
  client.on("interactionCreate", async interaction => {
    if (!interaction.isButton()) return;

    const [action, userId, date] = interaction.customId.split("_");
    const user = await client.users.fetch(userId).catch(() => null);

    if (!user) return interaction.reply({ content: "User not found ❌", ephemeral: true });

    const origEmbed = EmbedBuilder.from(interaction.message.embeds[0]);
    let components = interaction.message.components;

    if (action === "approve") {
      await user.send(`Your leave for ${date} has been approved ✅`);

      const claimBtn = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`claim_${userId}_${date}`)
          .setLabel("Claim")
          .setStyle(ButtonStyle.Primary)
      );

      origEmbed.setColor("Green").setFooter({ text: "Status: Approved" });
      await interaction.update({ embeds: [origEmbed], components: [claimBtn] });

    } else if (action === "decline") {
      await user.send(`Your leave for ${date} has not been authorized ❌. Taking a day off will result in a fine.`);
      origEmbed.setColor("Red").setFooter({ text: "Status: Declined" });
      await interaction.update({ embeds: [origEmbed], components: [] });

    } else if (action === "claim") {
      const claimer = interaction.user.username;
      origEmbed.setFooter({ text: `Status: Claimed by ${claimer}` });

      // Remove only the claim button clicked, keep others (if multiple) intact
      components = components.map(row => {
        const newRow = ActionRowBuilder.from(row);
        newRow.components = newRow.components.filter(btn => btn.customId !== interaction.customId);
        return newRow;
      });

      await interaction.update({ embeds: [origEmbed], components });
    }
  });
};
