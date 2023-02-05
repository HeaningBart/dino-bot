import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { toUrl } from "../..";
import { prisma } from "../../database";

const allowedUsers = [
  "397857749938995201",
  "345938621137944577",
  "422790603064213528",
  "121671582044258306",
  "233286444083314699",
  "324522444285280276",
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("new")
    .setDescription(
      "Add a new series to the database, which you will be able to download raws from."
    )
    .setDefaultPermission(true)
    .addStringOption((string) =>
      string
        .setName("title")
        .setDescription("Type the series title")
        .setRequired(true)
    )
    .addStringOption((string) =>
      string
        .setName("kakaoid")
        .setDescription("Type the kakao ID from this series")
        .setRequired(true)
    )
    .addStringOption((string) =>
      string
        .setName("cron")
        .setRequired(true)
        .setDescription(
          "Release day of the series, it must be one of the options already set"
        )
        .addChoice("Monday", "monday")
        .addChoice("Tuesday", "tuesday")
        .addChoice("Wednesday", "wednesday")
        .addChoice("Thursday", "thursday")
        .addChoice("Friday", "friday")
        .addChoice("Saturday", "saturday")
        .addChoice("Sunday", "sunday")
    )
    .addBooleanOption((boolean) =>
      boolean
        .setName("weekly")
        .setRequired(true)
        .setDescription("is the series weekly? true/false")
    )
    .addRoleOption((role) =>
      role
        .setName("role")
        .setDescription("Role to be pinged every time a chapter is released")
        .setRequired(true)
    )
    .addChannelOption((channel) =>
      channel
        .setName("channel")
        .setDescription("channel in which the chapter will be sent")
        .setRequired(true)
    )
    .addIntegerOption((integer) =>
      integer
        .setName("priority")
        .setRequired(true)
        .setDescription("Priority of this series in the database")
    ),
  async execute(interaction: CommandInteraction) {
    const user = interaction.member?.user.id!;

    const isAllowed = await prisma.allowedUsers.findFirst({
      where: { user_id: user },
    });

    if (!isAllowed) {
      await interaction.editReply(`You're not allowed to use this command.`);
      return;
    }

    const priority = interaction.options.getInteger("priority")!;
    const role = interaction.options.getRole("role")!;
    const channel = interaction.options.getChannel("channel")!;
    const weekly = interaction.options.getBoolean("weekly")!;
    const kakaoid = interaction.options.getString("kakaoid")!;
    const title = interaction.options.getString("title")!;
    const cron = interaction.options.getString("cron")!;
    const slug = toUrl(title);
    const series = await prisma.series.create({
      data: {
        role: role.id,
        channel: channel.id,
        weekly,
        kakaoId: kakaoid,
        title,
        cron,
        slug,
        priority,
      },
    });
    await interaction.editReply("Series added to the database.");
    await interaction.channel?.send(
      `Series Title: ${series.title}, Release day: ${series.cron}, Role to be pinged: <@&${series.role}>, Channel: <#${series.channel}>`
    );
    return;
  },
};
