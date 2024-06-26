import {
  CommandInteraction,
  REST,
  Routes,
  SlashCommandBuilder,
} from 'discord.js'
const token = process.env.token!
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const rest = new REST().setToken(token)
import { prisma } from '../../database/index.js'
import {
  getChaptersList,
  getFullChaptersList,
  getSpecificChapter as getChapter,
} from '../../rawhandler/index.js'
import { rawsQueue } from '../../queue/raws.js'

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
    .setName('range')
    .setDescription('Downloads chapters from within a range')
    .setDefaultPermission(true)
    .addStringOption((string) =>
      string.setName('seriesid').setRequired(true).setDescription(`Series ID.`)
    )
    .addNumberOption((number) =>
      number
        .setName('start')
        .setRequired(true)
        .setDescription(`Where to start.`)
    )
    .addNumberOption((number) =>
      number.setName('end').setRequired(true).setDescription(`Where to end`)
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
    const range_seriesid = interaction.options.get('seriesid', true)
      .value as string
    const range_start = interaction.options.get('start', true).value as number
    const range_end = interaction.options.get('end', true).value as number

    for (let i = range_start; i <= range_end; i++) {
      await rawsQueue.add('range-chapter', {
        kakaoId: range_seriesid,
        channel_id: interaction.channelId,
        command: 'getchapter',
        type: 'kakao',
        chapter_number: `${i}`,
      })
    }

    await interaction.editReply('Done.')
  },
}
