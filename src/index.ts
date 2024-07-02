import { Job } from 'bullmq'
import { client } from './client/index.js'
import { rawsQueue, worker, RawsPayload } from './queue/raws.js'
import { Events } from 'discord.js'

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return
  try {
    await interaction.deferReply()
    const command = client.commands.get(interaction.commandName)
    console.log(command)
    if (!command) {
      console.error(`No command matching ${interaction.commandName} was found.`)
      return
    }
    await command.execute(interaction)
    await interaction.editReply('Chapter added to the queue!')
  } catch (error) {
    console.error(error)
    await interaction.reply({
      content: 'There was an error while executing this command!',
      ephemeral: true,
    })
  }
})

client.once('ready', async () => {
  client.user &&
    client.user.setActivity(`Chapters on the queue: ${await rawsQueue.count()}`)
})

worker.on('drained', async () => {
  client.user &&
    client.user.setActivity(`Chapters on the queue: ${await rawsQueue.count()}`)
})

worker.on('completed', async (job: Job<RawsPayload>) => {
  const { channel_id } = job.data
  const chapter = job.returnvalue
  if (chapter) {
    const channel = client.channels.cache.get(channel_id)
    if (channel?.isTextBased()) {
      await channel.send(`Chapter: ${chapter}`)
      await channel.send(
        `Don't forget to report your progress in <#794058643624034334> after you are done with your part.`
      )
    }
  }
})

worker.on('progress', async (job: Job<RawsPayload>) => {
  client.user &&
    client.user.setActivity(
      `I'm working on chapter ${job.data.chapter_number} of ${job.data.kakaoId}!`
    )
})

export { client }
