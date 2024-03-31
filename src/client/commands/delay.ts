import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction, MessageEmbed } from 'discord.js'
import { prisma } from '../../database/index.js'

export default {
  data: new SlashCommandBuilder()
    .setName('delay')
    .setDescription('Delay all series from database/index.js')
    .addNumberOption((number) =>
      number
        .setName('minutes')
        .setDescription('How many minutes to delay')
        .setRequired(true)
        .setMinValue(10)
        .setMaxValue(58)
    )
    .addBooleanOption((boolean) =>
      boolean
        .setName('reset')
        .setDescription('Would you like to reset the cron to 10:01PM kst?')
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

    const minutes = interaction.options.getNumber('minutes')!
    const reset = interaction.options.getBoolean('reset')!

    await interaction.editReply('Done.')
    return
  },
}
