import { TextChannel } from "discord.js";
import { getLatestChapter, logInAndSetCookies } from "./rawhandler";
import schedule from "node-schedule";
import { Series } from "@prisma/client";
import { client } from "./client";
import { rawsQueue } from "./queue/bull";
const { log_channel } = require("../config.json");
import { prisma } from "./database";

export function toUrl(string: string): string {
  return string
    .toLowerCase()
    .replaceAll(".", "-")
    .replaceAll(`'`, "")
    .replaceAll(/[!$%^&*()_+|~=`{}\[\]:";'<>?,\/]/g, "")
    .replaceAll(" ", "-");
}

function getDay() {
  const week_days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const today = new Date();
  return week_days[today.getDay()];
}

async function getWeeklyRaw(series: Series) {
  client.user?.setPresence({
    status: "dnd",
    activities: [
      {
        name: `Getting raws of ${series.title}`,
        type: "WATCHING",
        url: "https://reaperscans.com",
      },
    ],
  });
  const channel = client.channels.cache.get(series.channel) as TextChannel;
  const role = series.role;
  const file = await getLatestChapter(series.kakaoId, series.slug);
  if (file?.startsWith("https")) {
    await channel.send({
      content: `Weekly chapter of ${series.title}, <@&${role}>, <@&946250134042329158>: ${file}`,
    });
  } else {
    await channel.send({
      content: `Weekly chapter of ${series.title}, <@&${role}>, <@&946250134042329158>: https://raws.reaperscans.com/${file}`,
    });
  }
  await channel.send(
    `Don't forget to report your progress in <#794058643624034334> after you are done with your part.`
  );

  client.user?.setPresence({
    status: "dnd",
    activities: [
      {
        name: `I'm Heaning's creation.`,
        type: "WATCHING",
        url: "https://reaperscans.com",
      },
    ],
  });
}

schedule.scheduleJob("01 10 * * *", async function () {
  const cron = getDay();
  try {
    const daily_series = await prisma.series.findMany({
      where: { cron, weekly: true },
      orderBy: { priority: "desc" },
    });
    for (let i = 0; i <= daily_series.length - 1; i++) {
      try {
        await getWeeklyRaw(daily_series[i]);
      } catch (error) {
        const channel = client.channels.cache.get(log_channel) as TextChannel;
        await channel.send("Error while getting the raws, ping the developer.");
        await channel.send("Stack: " + error);
      }
    }
  } catch (error) {
    console.log(error);
  }
});

process.on("exit", async () => {
  rawsQueue.close();
});

logInAndSetCookies()
  .then(() => "Tudo certo!")
  .catch((e) => console.log(e));

export { client };
