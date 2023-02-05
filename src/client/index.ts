import { SlashCommandBuilder } from "@discordjs/builders";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import {
  Client,
  Collection,
  Intents,
  MessageEmbed,
  TextChannel,
} from "discord.js";
const { token } = require("../../config.json");
import fs from "fs/promises";
import path from "path";

type customClient = Client<boolean> & { commands: Collection<any, any> };

type commandType = {
  data: SlashCommandBuilder;
  execute: () => Promise<any>;
};

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
  ],
}) as customClient;

client.commands = new Collection();

const rest = new REST({ version: "9" }).setToken(token);

client.on("ready", async () => {
  try {
    console.log("Getting the command handling ready...");
    const commands_path = path.join(__dirname, "commands");
    const commands_files = (await fs.readdir(commands_path)).filter((file) =>
      file.endsWith(".ts")
    );
    for (const file of commands_files) {
      const file_path = path.join(commands_path, file);
      const command = (await import(file_path)) as commandType;
      if ("data" in command && "execute" in command) {
        client.commands.set(command.data.name, command);
      } else {
        console.log(
          `[WARNING] The command at ${file_path} is missing a required "data" or "execute" property.`
        );
      }
    }
    console.log("The bot is ready!");

    // const channel = client.channels.cache.get(`794058138110001184`);

    // if (channel?.isText()) {
    //   channel.send("yes");
    // }
  } catch (error) {
    console.log(error);
  }
});

console.log(token);

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;
  await interaction.deferReply();
  try {
    const command = client.commands.get(interaction.commandName);
    if (!command) {
      console.error(
        `No command matching ${interaction.commandName} was found.`
      );
      return;
    }
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "There was an error while executing this command!",
      ephemeral: true,
    });
  }
});

client.login(token);

export { client };
