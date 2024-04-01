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

type commandType = {
  data: SlashCommandBuilder
  execute: () => Promise<any>
}

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
    .setName('update')
    .setDescription('Updates the server with the most recent commands.')
    .setDefaultPermission(true),
  async execute(interaction: CommandInteraction) {
    const user = interaction.member?.user.id!
    if (!allowedUsers.includes(user)) {
      await interaction.editReply(`You're not allowed to use this command.`)
      return
    }

    const commands = []

    const commands_files = (await fs.readdir(__dirname)).filter(
      (file) => file.endsWith('.ts') || file.endsWith('.js')
    )
    for (const file of commands_files) {
      const command = (await import(`./${file}`)).default as commandType
      commands.push(command.data)
    }

    await rest.put(
      Routes.applicationGuildCommands(
        interaction.applicationId,
        interaction.guildId!
      ),
      { body: commands }
    )

    interaction.editReply({ content: 'Updated commands.' })
  },
}
