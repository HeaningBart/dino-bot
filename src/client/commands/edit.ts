import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction } from 'discord.js'
import { toUrl } from '../..';
import { prisma } from '../../database'

const allowedUsers = [
    "397857749938995201",
    "345938621137944577",
    "422790603064213528",
    "121671582044258306",
    "233286444083314699",
    "324522444285280276",
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('change')
        .setDescription('Edit a series from the database')
        .setDefaultPermission(true)
        .addNumberOption(number =>
            number.setName('id')
                .setDescription('Enter the series ID (from our database).')
                .setRequired(true)
        )
        .addBooleanOption(boolean =>
            boolean.setName('weekly')
                .setDescription('Enter the weekly status of this series.')
                .setRequired(true))
        .addIntegerOption(integer =>
            integer.setName('priority')
                .setRequired(true)
                .setDescription('Priority of this series in the database')
        ),
    async execute(interaction: CommandInteraction) {
        const user = interaction.member?.user.id!;
        if (!allowedUsers.includes(user)) {
            await interaction.editReply(`You're not allowed to use this command.`);
            return;
        }
        const weekly_status = interaction.options.getBoolean("weekly")!;
        const series_id = interaction.options.getNumber("id")!;
        const new_priority = interaction.options.getInteger("priority")!;
        const exists = await prisma.series.findFirst({
            where: { id: series_id },
        });
        if (exists) {
            await prisma.series.update({
                where: { id: series_id },
                data: { weekly: weekly_status, priority: new_priority },
            });
            await interaction.channel?.send("Series updated.");
        } else await interaction.channel?.send("Series does not exist.");
        await interaction.editReply("Done.");
        return;
    }
}


