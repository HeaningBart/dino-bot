import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { toUrl } from "../../utils";
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
    .setName("allow")
    .setDescription("Allow an user to use the bot")
    .setDefaultPermission(true)
    .addUserOption((user) =>
      user
        .setName("user")
        .setRequired(true)
        .setDescription("Mention the user to be allowed")
    ),
  async execute(interaction: CommandInteraction) {
    const user = interaction.member?.user.id!;
    if (
      !allowedUsers.includes(user) &&
      !(await prisma.allowedUsers.findFirst({
        where: { user_id: user },
      }))
    ) {
      await interaction.editReply(`You're not allowed to use this command.`);
      return;
    }

    const allowed_user = interaction.options.getUser("user")!;

    await prisma.allowedUsers.create({
      data: {
        user_id: allowed_user.id,
      },
    });

    await interaction.editReply(`New user allowed: <@${allowed_user.id}>`);
  },
};
