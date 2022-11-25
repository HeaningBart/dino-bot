import { Client, Intents, MessageEmbed } from "discord.js";
const { token } = require("../config.json");
import {
  getSpecificChapter as getChapter,
  processNaver,
  getChaptersList,
  getLatestChapter
} from "./rawhandler";
import { start, logIn, buyTicket } from "./rawhandler/kakao";
import {
  logIn as ridiLogin,
  getLatestChapter as getLatestRidi,
  downloadChapter,
} from "./rawhandler/ridibooks";
import schedule from "node-schedule";
import { PrismaClient, Series } from "@prisma/client";
const allowedUsers = [
  "397857749938995201",
  "345938621137944577",
  "422790603064213528",
  "121671582044258306",
  "233286444083314699",
  "324522444285280276",
];
import express, { Express, Request, Response } from "express";
import {
  getLatestChapter as JPLatestChapter,
  logIn as JPLogin,
  start as JPStart,
  getListOfChapters,
  getSpecificChapter,
} from "./rawhandler/japan";

const app: Express = express();
const port = process.env.PORT || 3000;

const prisma = new PrismaClient();

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
  ],
});

export function toUrl(string: string): string {
  return string
    .toLowerCase()
    .replaceAll(".", "-")
    .replaceAll(`'`, "")
    .replaceAll(/[!$%^&*()_+|~=`{}\[\]:";'<>?,\/]/g, "")
    .replaceAll(" ", "-");
}

client.on("ready", async () => {
  console.log("The bot is ready!");
  console.log("For sure!");
  await client.guilds.cache.get("794049571973890068")?.commands.create({
    name: "edit",
    description: "Edit a series from the database",
    type: "CHAT_INPUT",
    options: [
      {
        name: "id",
        description: "Enter the series ID (from our database).",
        type: "NUMBER",
        required: true,
      },
      {
        name: "weekly",
        description: "Enter the weekly status of this series.",
        type: "BOOLEAN",
        required: true,
      },
      {
        name: "priority",
        description: "Enter the priority of the series",
        type: "INTEGER",
        required: true,
      },
    ],
  });
  client.user?.setPresence({
    status: "dnd",
    activities: [
      {
        name: "im almost rping the world",
        type: "WATCHING",
        url: "https://reaperscans.com",
      },
    ],
  });
});

type SeriesItem = {
  id: string;
  title: string;
};



const monday_job = schedule.scheduleJob('01 8 * * 1', async function () {
  try {
    const daily_series = await prisma.series.findMany({ where: { cron: 'monday', weekly: true }, orderBy: { priority: 'desc' } });
    for (let i = 0; i <= daily_series.length - 1; i++) {
      try {
        client.user?.setPresence({
          status: "dnd",
          activities: [
            {
              name: `RPing ${daily_series[i].title}`,
              type: "WATCHING",
              url: "https://reaperscans.com",
            },
          ],
        });
        const series = daily_series[i];
        const channel = client.channels.cache.get(series.channel);
        const role = series.role;
        if (channel?.isText()) {
          const file = await getLatestChapter(series.kakaoId, series.slug);
          if (file) {
            await channel.send({
              content: `Weekly chapter of ${series.title}: https://raws.reaperscans.com/${file}`
            })
            await channel.send(`<@&${role}>, <@&946250134042329158>`);
            await channel.send(`Don't forget to report your progress in <#794058643624034334> after you are done with your part.`)
            await channel.send('Weekly RP done.');
          }
        }
      } catch (error) {
        console.log(error);
        const log_channel = client.channels.cache.get('948063125486329876');
        if (log_channel?.isText()) {
          await log_channel.send('There was an error during the RP process of a series.');
          await log_channel.send(`Please, get the chapter through /getchapter`);
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
})

const tuesday_job = schedule.scheduleJob('01 8 * * 2', async function () {
  try {
    const daily_series = await prisma.series.findMany({ where: { cron: 'tuesday', weekly: true }, orderBy: { priority: 'desc' } });
    for (let i = 0; i <= daily_series.length - 1; i++) {
      try {
        client.user?.setPresence({
          status: "dnd",
          activities: [
            {
              name: `RPing ${daily_series[i].title}`,
              type: "WATCHING",
              url: "https://reaperscans.com",
            },
          ],
        });
        const series = daily_series[i];
        const channel = client.channels.cache.get(series.channel);
        const role = series.role;
        if (channel?.isText()) {
          const file = await getLatestChapter(series.kakaoId, series.slug);
          if (file) {
            await channel.send({
              content: `Weekly chapter of ${series.title}: https://raws.reaperscans.com/${file}`
            })
            await channel.send(`<@&${role}>, <@&946250134042329158>`);
            await channel.send(`Don't forget to report your progress in <#794058643624034334> after you are done with your part.`)
            await channel.send('Weekly RP done.');
          }
        }
      } catch (error) {
        console.log(error);
        const log_channel = client.channels.cache.get('948063125486329876');
        if (log_channel?.isText()) {
          await log_channel.send('There was an error during the RP process of a series.');
          await log_channel.send(`Please, get the chapter through /getchapter`);
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
})



const rr_job = schedule.scheduleJob('10 10 * * 2', async function () {
  try {
    try {
      client.user?.setPresence({
        status: "dnd",
        activities: [
          {
            name: `RPing Ranker's Return`,
            type: "WATCHING",
            url: "https://reaperscans.com",
          },
        ],
      });
      const channel = client.channels.cache.get('871239733286674503');
      if (channel?.isText()) {
        const file = await getLatestChapter('57552517', 'rankers-return');
        if (file) {
          await channel.send({
            content: `Weekly chapter of Ranker's Return: https://raws.reaperscans.com/${file}`
          })
          await channel.send(`<@&871239863792435221>, <@&946250134042329158>`);
          await channel.send(`Don't forget to report your progress in <#794058643624034334> after you are done with your part.`)
          await channel.send('Weekly RP done.');
        }
      }
    } catch (error) {
      console.log(error);
      const log_channel = client.channels.cache.get('948063125486329876');
      if (log_channel?.isText()) {
        await log_channel.send(`There was an error during the RP process of a series - Ranker's Return.`);
        await log_channel.send(`Please, get the chapter through /getchapter or access the server via FTP and get the .7z file.`);
      }
    }
  } catch (error) {
    console.log(error);
  }
})



const wednesday_job = schedule.scheduleJob('01 8 * * 3', async function () {
  try {
    const daily_series = await prisma.series.findMany({ where: { cron: 'wednesday', weekly: true }, orderBy: { priority: 'desc' } });
    for (let i = 0; i <= daily_series.length - 1; i++) {
      try {
        client.user?.setPresence({
          status: "dnd",
          activities: [
            {
              name: `RPing ${daily_series[i].title}`,
              type: "WATCHING",
              url: "https://reaperscans.com",
            },
          ],
        });
        const series = daily_series[i];
        const channel = client.channels.cache.get(series.channel);
        const role = series.role;
        if (channel?.isText()) {
          const file = await getLatestChapter(series.kakaoId, series.slug);
          if (file) {
            await channel.send({
              content: `Weekly chapter of ${series.title}: https://raws.reaperscans.com/${file}`
            })
            await channel.send(`<@&${role}>, <@&946250134042329158>`);
            await channel.send(`Don't forget to report your progress in <#794058643624034334> after you are done with your part.`)
            await channel.send('Weekly RP done.');
          }
        }
      } catch (error) {
        console.log(error);
        const log_channel = client.channels.cache.get('948063125486329876');
        if (log_channel?.isText()) {
          await log_channel.send('There was an error during the RP process of a series.');
          await log_channel.send(`Please, get the chapter through /getchapter`);
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
})

const thursday_job = schedule.scheduleJob('01 8 * * 4', async function () {
  try {
    const daily_series = await prisma.series.findMany({ where: { cron: 'thursday', weekly: true }, orderBy: { priority: 'desc' } });
    for (let i = 0; i <= daily_series.length - 1; i++) {
      try {
        client.user?.setPresence({
          status: "dnd",
          activities: [
            {
              name: `RPing ${daily_series[i].title}`,
              type: "WATCHING",
              url: "https://reaperscans.com",
            },
          ],
        });
        const series = daily_series[i];
        const channel = client.channels.cache.get(series.channel);
        const role = series.role;
        if (channel?.isText()) {
          const file = await getLatestChapter(series.kakaoId, series.slug);
          if (file) {
            await channel.send({
              content: `Weekly chapter of ${series.title}: https://raws.reaperscans.com/${file}`
            })
            await channel.send(`<@&${role}>, <@&946250134042329158>`);
            await channel.send(`Don't forget to report your progress in <#794058643624034334> after you are done with your part.`)
            await channel.send('Weekly RP done.');
          }
        }
      } catch (error) {
        console.log(error);
        const log_channel = client.channels.cache.get('948063125486329876');
        if (log_channel?.isText()) {
          await log_channel.send('There was an error during the RP process of a series.');
          await log_channel.send(`Please, get the chapter through /getchapter`);
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
})

const friday_job = schedule.scheduleJob('01 8 * * 5', async function () {
  try {
    const daily_series = await prisma.series.findMany({ where: { cron: 'friday', weekly: true }, orderBy: { priority: 'desc' } });
    for (let i = 0; i <= daily_series.length - 1; i++) {
      try {
        client.user?.setPresence({
          status: "dnd",
          activities: [
            {
              name: `RPing ${daily_series[i].title}`,
              type: "WATCHING",
              url: "https://reaperscans.com",
            },
          ],
        });
        const series = daily_series[i];
        const channel = client.channels.cache.get(series.channel);
        const role = series.role;
        if (channel?.isText()) {
          const file = await getLatestChapter(series.kakaoId, series.slug);
          if (file) {
            await channel.send({
              content: `Weekly chapter of ${series.title}: https://raws.reaperscans.com/${file}`
            })
            await channel.send(`<@&${role}>, <@&946250134042329158>`);
            await channel.send(`Don't forget to report your progress in <#794058643624034334> after you are done with your part.`)
            await channel.send('Weekly RP done.');
          }
        }
      } catch (error) {
        console.log(error);
        const log_channel = client.channels.cache.get('948063125486329876');
        if (log_channel?.isText()) {
          await log_channel.send('There was an error during the RP process of a series.');
          await log_channel.send(`Please, get the chapter through /getchapter`);
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
})

const saturday_job = schedule.scheduleJob('01 8 * * 6', async function () {
  try {
    const daily_series = await prisma.series.findMany({ where: { cron: 'saturday', weekly: true }, orderBy: { priority: 'desc' } });
    for (let i = 0; i <= daily_series.length - 1; i++) {
      try {
        client.user?.setPresence({
          status: "dnd",
          activities: [
            {
              name: `RPing ${daily_series[i].title}`,
              type: "WATCHING",
              url: "https://reaperscans.com",
            },
          ],
        });
        const series = daily_series[i];
        const channel = client.channels.cache.get(series.channel);
        const role = series.role;
        if (channel?.isText()) {
          const file = await getLatestChapter(series.kakaoId, series.slug);
          if (file) {
            await channel.send({
              content: `Weekly chapter of ${series.title}: https://raws.reaperscans.com/${file}`
            })
            await channel.send(`<@&${role}>, <@&946250134042329158>`);
            await channel.send(`Don't forget to report your progress in <#794058643624034334> after you are done with your part.`)
            await channel.send('Weekly RP done.');
          }
        }
      } catch (error) {
        console.log(error);
        const log_channel = client.channels.cache.get('948063125486329876');
        if (log_channel?.isText()) {
          await log_channel.send('There was an error during the RP process of a series.');
          await log_channel.send(`Please, get the chapter through /getchapter`);
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
})

const sunday_job = schedule.scheduleJob('01 8 * * 7', async function () {
  try {
    const daily_series = await prisma.series.findMany({ where: { cron: 'sunday', weekly: true }, orderBy: { priority: 'desc' } });
    for (let i = 0; i <= daily_series.length - 1; i++) {
      try {
        client.user?.setPresence({
          status: "dnd",
          activities: [
            {
              name: `RPing ${daily_series[i].title}`,
              type: "WATCHING",
              url: "https://reaperscans.com",
            },
          ],
        });
        const series = daily_series[i];
        const channel = client.channels.cache.get(series.channel);
        const role = series.role;
        if (channel?.isText()) {
          const file = await getLatestChapter(series.kakaoId, series.slug);
          if (file) {
            await channel.send({
              content: `Weekly chapter of ${series.title}: https://raws.reaperscans.com/${file}`
            })
            await channel.send(`<@&${role}>, <@&946250134042329158>`);
            await channel.send(`Don't forget to report your progress in <#794058643624034334> after you are done with your part.`)
            await channel.send('Weekly RP done.');
          }
        }
      } catch (error) {
        console.log(error);
        const log_channel = client.channels.cache.get('948063125486329876');
        if (log_channel?.isText()) {
          await log_channel.send('There was an error during the RP process of a series.');
          await log_channel.send(`Please, get the chapter through /getchapter`);
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
})

client.on("interactionCreate", async (interaction) => {
  try {

    if (!interaction.isCommand()) {
      return;
    }
    const type = interaction.commandName;
    await interaction.deferReply();
    const user = interaction.member?.user.id!;
    switch (type) {
      // case 'mass':
      // if (!allowedUsers.includes(user)) {
      //     await interaction.editReply(`You're not allowed to use this command.`)
      //     return;
      // }
      // const id = interaction.options.getString('kakaoid')!;
      // const starts_at = interaction.options.getNumber('startsat')!;
      // const series_title = interaction.options.getString('title')!;
      // const chapters = await buyTicket(id, starts_at, series_title);
      // await interaction.editReply('Done.');
      // await Promise.all(chapters.map((file: any) => interaction.channel?.send({ files: [file] })))
      // await Promise.all(chapters.map((chapter: any) => fs.unlink(chapter)));
      // await interaction.channel?.send('RP done.')
      // await interaction.editReply('Done.');
      // return;
      // return;
      case "add":
        if (!allowedUsers.includes(user)) {
          await interaction.editReply(`You're not allowed to use this command.`);
          return;
        }
        const priority = interaction.options.getInteger("priority")!;
        const role = interaction.options.getRole("role")!;
        const channel = interaction.options.getChannel("channel")!;
        const weekly = interaction.options.getBoolean("weekly")!;
        const kakaoid = interaction.options.getString("kakaoid")!;
        const title = interaction.options.getString("title")!;
        const cron = interaction.options.getString("cron")!;
        const slug = toUrl(title);
        const series = await prisma.series.create({
          data: {
            role: role.id,
            channel: channel.id,
            weekly,
            kakaoId: kakaoid,
            title,
            cron,
            slug,
            priority,
          },
        });
        await interaction.editReply("Series added to the database.");
        await interaction.channel?.send(
          `Series Title: ${series.title}, Release day: ${series.cron}, Role to be pinged: <@&${series.role}>, Channel: <#${series.channel}>`
        );
        return;
      case "getseries":
        const release_day = interaction.options.getString("releaseday")!;
        const all_series = await prisma.series.findMany({
          where: { cron: release_day },
          orderBy: { priority: "desc" },
        });
        let embeds: any = [];
        all_series.map((series) => {
          let embed = new MessageEmbed()
            .setTitle(series.title)
            .addField("Weekly", series.weekly.toString(), true)
            .addField("Slug", series.slug, true)
            .addField("ID", series.id.toString(), true)
            .addField("Release Day", series.cron, true)
            .addField("Role to be pinged", `<@&${series.role}>`, true)
            .addField("Series Priority", series.priority.toString(), true)
            .addField(
              "Channel for the message to be sent",
              `<#${series.channel}>`,
              true
            );

          embeds.push(embed);
        });
        if (embeds.length > 0) await interaction.channel?.send({ embeds });
        else await interaction.channel?.send("No series found.");
        await interaction.editReply("Done.");
        return;
      case "edit":
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
      case "remove":
        if (!allowedUsers.includes(user)) {
          await interaction.editReply(`You're not allowed to use this command.`);
          return;
        }
        const removed_id = interaction.options.getString('kakaoid')!;
        await prisma.series.deleteMany({ where: { kakaoId: removed_id } });
        await interaction.editReply('Series removed.');
        return;
      case "getchapter":
        if (!allowedUsers.includes(user)) {
          await interaction.editReply(`You're not allowed to use this command.`);
          return;
        }
        const kakao_series_id = interaction.options.getString("kakaoid")!;
        const chapter_number = interaction.options.getInteger("chapternumber")!;
        const kakao_title = interaction.options.getString("seriestitle")!;
        try {
          const specified_file = await getChapter(
            kakao_series_id,
            chapter_number,
            toUrl(kakao_title)
          );
          if (specified_file) {
            await interaction.channel?.send(`https://raws.reaperscans.com/${specified_file}`)
          }
        } catch (error) {
          await interaction.channel?.send('An error happened, the bot will try to RP the chapter again.')
          const specified_file = await getChapter(
            kakao_series_id,
            chapter_number,
            toUrl(kakao_title)
          );
          if (specified_file) {
            await interaction.channel?.send(`https://raws.reaperscans.com/${specified_file}`)
          }
        }
        await interaction.editReply("RP done.");
        return;
      case "process":
        if (!allowedUsers.includes(user)) {
          await interaction.editReply(`You're not allowed to use this command.`);
          return;
        }
        const download_url = interaction.options.getString("url")!;
        const channel_id = interaction.options.getChannel("channel")!.id;
        const channel_name = interaction.options.getChannel("channel")!.name;
        const role_id = interaction.options.getRole("role")!.id;
        try {
          const processed_file = await processNaver(download_url, channel_name);
          if (processed_file) {
            const target_channel = client.channels.cache.get(channel_id);
            if (target_channel?.isText()) {
              await target_channel.send(`https://raws.reaperscans.com/${processed_file}`)
              await target_channel.send(`<@&${role_id}>, <@&946250134042329158>`);
              await target_channel.send(
                `Don't forget to report your progress in <#794058643624034334> after you are done with your part.`
              );
            }
          }
        } catch (error) {
          const target_channel = client.channels.cache.get(channel_id);
          if (target_channel?.isText()) {
            await target_channel.send(
              `There was an error during the file upload to Discord.`
            );
          }
        }
        await interaction.editReply("Done.");
        return;
      case "range":
        const range_seriesid = interaction.options.getString("seriesid")!;
        const range_start = interaction.options.getNumber("start")!;
        const range_end = interaction.options.getNumber("end")!;
        const new_chapters = await getChaptersList(range_seriesid, "asc");

        const chapters_to_rp = new_chapters.filter(
          (chapter) =>
            chapter.chapter_number >= range_start &&
            chapter.chapter_number <= range_end
        ).reverse();

        for (let i = 0; i <= chapters_to_rp.length - 1; i++) {
          try {
            const length = chapters_to_rp.length - 1;
            await interaction.editReply(`RPing chapters... (${i + 1}/${length})`);
            const chapter = await getChapter(
              range_seriesid,
              chapters_to_rp[i].chapter_number,
              range_seriesid
            );
            if (chapter) {
              await interaction.channel?.send(`https://raws.reaperscans.com/${chapter}`)
            }
          } catch (error) {
            console.log(error);
          }
        }
        await interaction.editReply("Done.");
        return;
      case "jpchapter":
        const jp_browser = await JPStart();
        await JPLogin(jp_browser);
        const jp_seriesid = interaction.options.getString("seriesid")!;
        const series_name = toUrl(interaction.options.getString("seriesname")!);


        try {
          const jp_file_url = await JPLatestChapter(jp_seriesid, series_name, jp_browser)
          if (jp_file_url) {
            await interaction.channel?.send({
              files: [`./public/${jp_file_url}`],
            });
            await interaction.channel?.send(
              `Don't forget to report your progress in <#794058643624034334> after you are done with your part.`
            );
          }
        } catch (error) { }
        return;
      case "rp":
        const new_seriesid = interaction.options.getString("seriesid")!;
        const new_chapter_number = interaction.options.getNumber("chapters")!;
        const new_series_name = toUrl(
          interaction.options.getString("seriesname")!
        );
        try {
          const specified_file = await getChapter(
            new_seriesid,
            new_chapter_number,
            toUrl(new_series_name)
          );
          if (specified_file) {
            await interaction.channel?.send(`https://raws.reaperscans.com/${specified_file}`)
          }
        } catch (error) {
          console.log(error);
        }
        await interaction.editReply("RP done.");
        return;

      default:
        await interaction.editReply("Done.");
        return;
    }
  } catch (error) {
    console.log(error)
  }
});

client
  .login(token)
  .then((data) => console.log(data))
  .catch((error) => console.log(error));


// (async () => {
//   const browser = await JPStart();
//   await JPLogin(browser);
//   await JPLatestChapter('81737', 'dp', browser);

// })();




