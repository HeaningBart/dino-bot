import { TextChannel } from "discord.js";
import { logInAndSetCookies } from "./rawhandler";
import schedule from "node-schedule";
import { client } from "./client";
import { rawsQueue } from "./queue/raws";
const { log_channel, cron } = require("../config.json");
import { prisma } from "./database";
import { setCron, getWeeklyRaw, getDay } from "./utils";
import { start, logIn, getLatestChapter } from "./rawhandler/japan";

schedule.scheduleJob(cron, async function () {
  const daily = getDay();
  try {
    const daily_series = await prisma.series.findMany({
      where: { cron: daily, weekly: true },
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

    await setCron(1, true);
  } catch (error) {
    console.log(error);
  }
});

process.on("exit", async () => {
  rawsQueue.close();
});

export { client };
