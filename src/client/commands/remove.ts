import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction } from 'discord.js'
import { prisma } from '../../database/index.js'

const allowedUsers = [
  '397857749938995201',
  '345938621137944577',
  '422790603064213528',
  '121671582044258306',
  '233286444083314699',
  '324522444285280276',
]

export default {
  data: new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Remove a series from our database')
    .setDefaultPermission(true)
    .addStringOption((string) =>
      string
        .setName('kakaoid')
        .setDescription('Type the kakaoID of the series.')
        .setRequired(true)
    ),
  async execute(interaction: CommandInteraction) {
    const user = interaction.member?.user.id!
    const isAllowed = await prisma.allowedUsers.findFirst({
      where: { user_id: user },
    })

    if (!isAllowed) {
      await interaction.editReply(`You're not allowed to use this command.`)
      return
    }
    const removed_id = interaction.options.getString('kakaoid')!
    await prisma.series.deleteMany({ where: { kakaoId: removed_id } })
    await interaction.editReply('Series removed.')
    return
  },
}
