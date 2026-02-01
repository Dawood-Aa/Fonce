const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder } = require("discord.js");

module.exports = (client) => {
  
  // REGISTER SLASH COMMANDS (can also use rest API for guild commands)
  client.once("ready", async () => {
    const data = [
      new SlashCommandBuilder()
        .setName("leave")
        .setDescription("Submit a leave request")
    ].map(cmd => cmd.toJSON());

    const guild = client.guilds.cache.first(); // for testing, use your server
    if (!guild) return console.log("No guild found");
    await guild.commands.set(data);
    console.log("Leave command registered");
  });

  // Handle slash command
  client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName === "leave") {
      
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
    }
  });

  // Handle modal submission
  client.on("interactionCreate", async interaction => {
    if (!interaction.isModalSubmit()) return;
    if (interaction.customId !== "leaveModal") return;

    const name = interaction.fields.getTextInputValue("name");
    const dates = interaction.fields.getTextInputValue("dates").split(",").map(d => d.trim());
    const shift = interaction.fields.getTextInputValue("shift");
    const models = interaction.fields.getTextInputValue("models");
    const reason = interaction.fields.getTextInputValue("reason");

    await interaction.reply({ content: "Leave request submitted ✅", ephemeral: true });

    const leaveChannel = interaction.guild.channels.cache.find(ch => ch.name === "leave-requests"); // set your channel name

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
            .setCustomId(`approve_${name}_${date}`)
            .setLabel("Approve")
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`decline_${name}_${date}`)
            .setLabel("Decline")
            .setStyle(ButtonStyle.Danger)
        );

      await leaveChannel.send({ embeds: [embed], components: [buttons] });
    }
  });

  // Handle approve/decline
  client.on("interactionCreate", async interaction => {
    if (!interaction.isButton()) return;

    const [action, name, date] = interaction.customId.split("_");
    const user = client.users.cache.find(u => u.username === name); // better: store ID in modal if possible

    if (!user) return interaction.reply({ content: "User not found", ephemeral: true });

    if (action === "approve") {
      // send DM
      await user.send(`Your leave for ${date} has been approved ✅`);
      // replace buttons with claim
      const claimBtn = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`claim_${name}_${date}`)
          .setLabel("Claim")
          .setStyle(ButtonStyle.Primary)
      );

      const embed = EmbedBuilder.from(interaction.message.embeds[0])
        .setColor("Green")
        .setFooter({ text: "Status: Approved" });

      await interaction.update({ embeds: [embed], components: [claimBtn] });

    } else if (action === "decline") {
      await user.send(`Your leave for ${date} has not been authorized ❌. Taking a day off will result in a fine.`);
      const embed = EmbedBuilder.from(interaction.message.embeds[0])
        .setColor("Red")
        .setFooter({ text: "Status: Declined" });

      await interaction.update({ embeds: [embed], components: [] });
    } else if (action === "claim") {
      const claimer = interaction.user.username;
      const embed = EmbedBuilder.from(interaction.message.embeds[0])
        .setFooter({ text: `Status: Claimed by ${claimer}` });
      await interaction.update({ embeds: [embed], components: [] });
    }
  });
};
