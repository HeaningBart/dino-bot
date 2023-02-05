import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { prisma } from "../../database";
import {
  getChaptersList,
  getFullChaptersList,
  getSpecificChapter as getChapter,
} from "../../rawhandler";

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
    .setName("range")
    .setDescription("Downloads chapters from within a range")
    .setDefaultPermission(true)
    .addStringOption((string) =>
      string.setName("seriesid").setRequired(true).setDescription(`Series ID.`)
    )
    .addNumberOption((number) =>
      number
        .setName("start")
        .setRequired(true)
        .setDescription(`Where to start.`)
    )
    .addNumberOption((number) =>
      number.setName("end").setRequired(true).setDescription(`Where to end`)
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
    const range_seriesid = interaction.options.getString("seriesid")!;
    const range_start = interaction.options.getNumber("start")!;
    const range_end = interaction.options.getNumber("end")!;
    const new_chapters = await getFullChaptersList(range_seriesid, "asc");

    const chapters_to_rp = new_chapters
      .filter(
        (chapter) =>
          chapter.chapter_number >= range_start &&
          chapter.chapter_number <= range_end
      )
      .reverse();

    for (let i = 0; i <= chapters_to_rp.length - 1; i++) {
      try {
        const length = chapters_to_rp.length - 1;
        await interaction.editReply(`RPing chapters... (${i + 1}/${length})`);
        const chapter = await getChapter(
          range_seriesid,
          chapters_to_rp[i].chapter_number,
          range_seriesid
        );
        if (chapter) {
          chapter.startsWith("https")
            ? await interaction.channel?.send(chapter)
            : await interaction.channel?.send(
                `https://raws.reaperscans.com/${chapter}`
              );
          await interaction.channel?.send(
            "**The link is valid for 72 hours. If you ever need to download the chapter after that time, talk to Heaning.**"
          );
        }
      } catch (error) {
        console.log(error);
      }
    }
    await interaction.editReply("Done.");
  },
};
