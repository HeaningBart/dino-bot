import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction } from 'discord.js'

import { prisma } from '../../database/index.js'
import { rawsQueue } from '../../queue/raws.js'
const allowedUsers = [
  '397857749938995201',
  '345938621137944577',
  '422790603064213528',
  '121671582044258306',
  '233286444083314699',
  '324522444285280276',
]

type RawsWebsites = 'kakao' | 'lezhin' | 'pyccoma' | 'ridi' | 'boomtoon'

export default {
  data: new SlashCommandBuilder()
    .setName('getchapter')
    .setDescription('Download a chapter with the number specified.')
    .setDefaultPermission(true)
    .addStringOption((string) =>
      string
        .setName('kakaoid')
        .setRequired(true)
        .setDescription(`Series description.`)
    )
    .addStringOption((string) =>
      string
        .setName('seriestitle')
        .setRequired(true)
        .setDescription(`Series' title.`)
    )
    .addStringOption((string) =>
      string
        .setName('type')
        .setRequired(true)
        .setDescription(
          `Type of the series. Kakao / lezhing / pyccoma(not supported yet)`
        )
        .addChoices([
          ['kakao', 'kakao'],
          ['lezhin', 'lezhin'],
          ['pyccoma', 'pyccoma'],
          ['ridi', 'ridi'],
          ['boomtoon', 'boomtoon'],
        ])
    )
    .addIntegerOption((integer) =>
      integer
        .setName('chapternumber')
        .setRequired(true)
        .setDescription(`Chapter's number`)
    ),
  async execute(interaction: CommandInteraction) {
    const user = interaction.member?.user.id!
    const isAllowed = await prisma.allowedUsers.findFirst({
      where: { user_id: user },
    })
    if (!isAllowed) {
      return
    }
    const kakao_series_id = interaction.options.getString('kakaoid')!
    const chapter_number = interaction.options.getInteger('chapternumber')!
    const type = interaction.options.getString('type')! as RawsWebsites
    await rawsQueue.add('raws', {
      kakaoId: kakao_series_id,
      channel_id: interaction.channelId,
      command: 'getchapter',
      chapter_number: chapter_number.toString(),
      type,
    })
    return
  },
}
