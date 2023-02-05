import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, MessageEmbed } from "discord.js";
import { prisma } from "../../database";
import { getRPTime } from "../../utils";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("getseries")
    .setDescription("Get all series from database")
    .setDefaultPermission(true)
    .addStringOption((string) =>
      string
        .setName("releaseday")
        .setDescription("Choose the release day")
        .addChoice("Monday", "monday")
        .addChoice("Tuesday", "tuesday")
        .addChoice("Wednesday", "wednesday")
        .addChoice("Thursday", "thursday")
        .addChoice("Friday", "friday")
        .addChoice("Saturday", "saturday")
        .addChoice("Sunday", "sunday")
        .setRequired(true)
    ),
  async execute(interaction: CommandInteraction) {
    const release_day = interaction.options.getString("releaseday")!;
    const all_series = await prisma.series.findMany({
      where: { cron: release_day },
      orderBy: { priority: "desc" },
    });
    let embeds: any = [];
    all_series.map((series) => {
      let embed = new MessageEmbed()
        .setTitle(series.title)
        .addField("Weekly", series.weekly.toString(), true)
        .addField("Slug", series.slug, true)
        .addField("ID", series.id.toString(), true)
        .addField("Release Day", series.cron, true)
        .addField("Role to be pinged", `<@&${series.role}>`, true)
        .addField("Series Priority", series.priority.toString(), true)
        .addField(
          "Channel for the message to be sent",
          `<#${series.channel}>`,
          true
        );

      embeds.push(embed);
    });

    const cron = await getRPTime();

    if (embeds.length > 0) await interaction.channel?.send({ embeds });
    else await interaction.channel?.send("No series found.");
    await interaction.channel?.send(`Series will be rped at ${cron}`);
    await interaction.editReply("Done.");
    return;
  },
};
