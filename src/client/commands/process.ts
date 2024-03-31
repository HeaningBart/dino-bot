import { SlashCommandBuilder } from '@discordjs/builders'
import { prisma } from '../../database/index.js'
import { CommandInteraction } from 'discord.js'
import { processNaver } from '../../rawhandler/index.js'

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
    .setName('process')
    .setDescription('Stitches + increases quality of images.')
    .setDefaultPermission(true)
    .addStringOption((string) =>
      string.setName('url').setRequired(true).setDescription(`File's url.`)
    )
    .addChannelOption((channel) =>
      channel
        .setName('channel')
        .setRequired(true)
        .setDescription(`Channel for the raw to be sent in.`)
    )
    .addRoleOption((role) =>
      role
        .setName('role')
        .setRequired(true)
        .setDescription(`Role to be pinged upon completion.`)
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
    const download_url = interaction.options.getString('url')!
    const channel_id = interaction.options.getChannel('channel')!.id
    const channel_name = interaction.options.getChannel('channel')!.name
    const role_id = interaction.options.getRole('role')!.id
    try {
      const processed_file = await processNaver(download_url, channel_name)
      if (processed_file) {
        const target_channel = interaction.client.channels.cache.get(channel_id)
        if (target_channel?.isText()) {
          processed_file.startsWith('https')
            ? await target_channel.send(processed_file)
            : await target_channel.send(
                `https://raws.reaperscans.com/${processed_file}`
              )
          await target_channel.send(`<@&${role_id}>, <@&946250134042329158>`)
          await target_channel.send(
            `Don't forget to report your progress in <#794058643624034334> after you are done with your part.`
          )
        }
      }
    } catch (error) {
      const target_channel = interaction.client.channels.cache.get(channel_id)
      if (target_channel?.isText()) {
        await target_channel.send(
          `There was an error during the file upload to Discord.`
        )
      }
    }
    await interaction.editReply('Done.')
    return
  },
}
