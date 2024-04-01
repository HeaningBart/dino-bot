import {
  Client,
  Collection,
  GatewayIntentBits,
  Events,
  REST,
  SlashCommandBuilder,
  Routes,
} from 'discord.js'
const token = process.env.token!
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

type customClient = Client<boolean> & { commands: Collection<any, any> }

type commandType = {
  data: SlashCommandBuilder
  execute: () => Promise<any>
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
  ],
}) as customClient

client.commands = new Collection()

const rest = new REST().setToken(token)

client.on('ready', async () => {
  try {
    console.log('Getting the command handling ready...')
    const commands_path = path.join(__dirname, 'commands')
    const commands_files = (await fs.readdir(commands_path)).filter(
      (file) => file.endsWith('.ts') || file.endsWith('.js')
    )
    for (const file of commands_files) {
      const file_path = path.join(commands_path, file)

      const command = (await import(`./commands/${file}`)).default
      if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command)
      } else {
        console.log(
          `[WARNING] The command at ${file_path} is missing a required "data" or "execute" property.`
        )
      }
    }
    console.log('The bot is ready!')

    const commands = []
    const command = (await import('./commands/update.js'))
      .default as commandType
    commands.push(command.data)

    await rest.put(Routes.applicationCommands(client.application!.id), {
      body: commands,
    })
  } catch (error) {
    console.log(error)
  }
})

console.log(token)

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isCommand()) return
  try {
    await interaction.deferReply()
    const command = client.commands.get(interaction.commandName)
    if (!command) {
      console.error(`No command matching ${interaction.commandName} was found.`)
      return
    }
    await command.execute(interaction)
    await interaction.editReply('Done!')
  } catch (error) {
    console.error(error)
    await interaction.reply({
      content: 'There was an error while executing this command!',
      ephemeral: true,
    })
  }
})

client.login(token)

export { client }
