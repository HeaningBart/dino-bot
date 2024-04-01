import { TextChannel } from 'discord.js'
import { getLatestChapter } from './rawhandler/index.js'
import { Series } from '@prisma/client'
import { client } from './client/index.js'
import fs from 'fs/promises'
const expected_cron = process.env.expected_cron!

export async function getWeeklyRaw(series: Series) {
  client.user?.setPresence({
    status: 'dnd',
    activities: [
      {
        name: `Getting raws of ${series.title}`,
        url: 'https://reaperscans.com',
      },
    ],
  })
  const channel = client.channels.cache.get(series.channel) as TextChannel
  const branch_channel = client.channels.cache.get(
    '1075036425424216104'
  ) as TextChannel
  const role = series.role
  const file = await getLatestChapter(series.kakaoId, series.slug)
  if (file?.startsWith('https')) {
    await channel.send({
      content: `Weekly chapter of ${series.title},<@&${role}> , <@&946250134042329158>: ${file}`,
    })
    await branch_channel.send({
      content: `Weekly chapter of ${series.title}, <@&878795695748956190>, <@&946250134042329158>: ${file}`,
    })
  } else {
    await channel.send({
      content: `Weekly chapter of ${series.title}, <@&${role}>, <@&946250134042329158>: https://raws.reaperscans.com/${file}`,
    })
  }
  await channel.send(
    `Don't forget to report your progress in <#794058643624034334> after you are done with your part.`
  )

  client.user?.setPresence({
    status: 'dnd',
    activities: [
      {
        name: `I'm Heaning's creation.`,
        url: 'https://reaperscans.com',
      },
    ],
  })
}

export function toUrl(string: string): string {
  return string
    .toLowerCase()
    .replaceAll('.', '-')
    .replaceAll(`'`, '')
    .replaceAll(/[!$%^&*()_+|~=`{}\[\]:";'<>?,\/]/g, '')
    .replaceAll(' ', '-')
}

export function getDay() {
  const week_days = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ]
  const today = new Date()
  return week_days[today.getDay()]
}
