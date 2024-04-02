import {
  CommandInteraction,
  REST,
  Routes,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from 'discord.js'
const token = process.env.token!
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const rest = new REST().setToken(token)

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
        .addChoices(
          { name: 'Kakao', value: 'kakao' },
          { name: 'Lezhin', value: 'lezhin' },
          { name: 'Pyccoma', value: 'pyccoma' },
          { name: 'Ridi', value: 'ridi' },
          { name: 'Boomtoon', value: 'boomtoon' }
        )
    )
    .addIntegerOption((integer) =>
      integer
        .setName('chapternumber')
        .setRequired(true)
        .setDescription(`Chapter's number`)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const user = interaction.member?.user.id!
    const isAllowed = await prisma.allowedUsers.findFirst({
      where: { user_id: user },
    })
    if (!isAllowed) {
      return
    }
    const kakao_series_id = interaction.options.getString('kakaoid', true)
    const chapter_number = interaction.options.getInteger('chapternumber', true)
    const type = interaction.options.getString('type', true) as RawsWebsites
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
