import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { toUrl } from "../../utils";
import { getSpecificChapter as getChapter } from "../../rawhandler";

import { prisma } from "../../database";
import { rawsQueue } from "../../queue/raws";
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
    .setName("getchapter")
    .setDescription("Download a chapter with the number specified.")
    .setDefaultPermission(true)
    .addStringOption((string) =>
      string
        .setName("kakaoid")
        .setRequired(true)
        .setDescription(`Series description.`)
    )
    .addStringOption((string) =>
      string
        .setName("seriestitle")
        .setRequired(true)
        .setDescription(`Series' title.`)
    )
    .addIntegerOption((integer) =>
      integer
        .setName("chapternumber")
        .setRequired(true)
        .setDescription(`Chapter's number`)
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
    const kakao_series_id = interaction.options.getString("kakaoid")!;
    const chapter_number = interaction.options.getInteger("chapternumber")!;
    const kakao_title = interaction.options.getString("seriestitle")!;
    const series = await prisma.series.findFirst({
      where: { kakaoId: kakao_series_id },
    });
    if (series)
      rawsQueue.add({
        kakaoId: series.kakaoId,
        channel_id: interaction.channelId,
        command: "getchapter",
        chapter_number: chapter_number.toString(),
        role_id: series.role,
        series_title: series.title,
      });
    if (!series)
      rawsQueue.add({
        kakaoId: kakao_series_id,
        channel_id: interaction.channelId,
        command: "getchapter",
        chapter_number: chapter_number.toString(),
      });
    await interaction.editReply(
      "Chapter added to the queue. It'll be sent in the channel in a few seconds/minutes."
    );
    return;
  },
};
