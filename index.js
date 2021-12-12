const axios = require("axios");
const moment = require("moment");
const { Client, Intents, MessageEmbed } = require("discord.js");
const client = new Client({
  intents: [Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILDS],
});
require("dotenv").config();

const schedule = require("node-schedule");

const url =
  "https://store-site-backend-static-ipv4.ak.epicgames.com/freeGamesPromotions";

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setActivity(">epichelp", { type: "LISTENING" });
});
client.on("ready", (client) => {
  //Send a message on a channel , every Thursday on 6PM.

  //First check if is sent
  let isSend = false;
  schedule.scheduleJob("* 0 18 * * 4", async () => {
    //If it is not sent, send it
    if (!isSend) {
      isSend = true;
      const i = await getGames("latest");

      //Send a message on channel before "spamming" with games
      client.channels.cache.get("709045710204436540").send("**LATEST GAMES**");
      i.forEach((data) => {
        const embed = new MessageEmbed()
          .setColor("#f2f2f2")
          .setTitle(data.title)
          .setURL(data.productURL)
          .setDescription(data.description)
          .addFields(
            {
              name: "Started on",
              value: data.startDate,
              inline: true,
            },
            {
              name: "Ends on",
              value: `${data.endDate} ${
                data.endDateDiffernce > 1
                  ? `( In ${data.endDateDiffernce} days )`
                  : `( In ${data.endDateDiffernce} day )`
              }`,
              inline: true,
            }
          )
          .setImage(data.imageURL)
          .setTimestamp()
          .setFooter("Made by eliac7#5541");
        client.channels.cache
          .get("709045710204436540")
          .send({ embeds: [embed] });
      });
    }
  });
});

const getGames = (arg) =>
  new Promise((resolve, reject) => {
    axios
      .get(url)
      .then((res) => {
        const data = res.data.data.Catalog.searchStore.elements;
        let gamesNow = [];
        let gamesLater = [];
        data.forEach(function (el) {
          if (el.promotions) {
            if (
              el.promotions.promotionalOffers &&
              el.promotions.promotionalOffers.length > 0 &&
              //Get only the totally free games (not these with discount)
              el.promotions.promotionalOffers[0].promotionalOffers[0]
                .discountSetting.discountPercentage == 0
            ) {
              let imagesGetThumbnail = el.keyImages.filter((obj) => {
                return obj.type === "Thumbnail";
              });
              let startDateRAW = moment.utc(
                el.promotions.promotionalOffers[0].promotionalOffers[0]
                  .startDate
              );
              let endDateRAW = moment.utc(
                el.promotions.promotionalOffers[0].promotionalOffers[0].endDate
              );
              gamesNow.push({
                description: el.description,
                title: el.title,
                productURL:
                  "https://www.epicgames.com/store/en-US/p/" + el.productSlug,
                imageURL: imagesGetThumbnail[0]?.url,
                startDate: startDateRAW.format("DD/MM/YY"),
                endDate: endDateRAW.format("DD/MM/YY"),
                startDateDiffernce: moment(startDateRAW).diff(moment(), "days"),
                endDateDiffernce: moment(endDateRAW).diff(moment(), "days"),
              });
            } else if (
              el.promotions.upcomingPromotionalOffers &&
              el.promotions.upcomingPromotionalOffers.length > 0
            ) {
              let imagesGetThumbnail = el.keyImages.filter((obj) => {
                return obj.type === "Thumbnail";
              });

              let startDateRAW = moment.utc(
                el.promotions.upcomingPromotionalOffers[0].promotionalOffers[0]
                  .startDate
              );
              let endDateRAW = moment.utc(
                el.promotions.upcomingPromotionalOffers[0].promotionalOffers[0]
                  .endDate
              );

              gamesLater.push({
                description: el.description,
                title: el.title,
                productURL:
                  "https://www.epicgames.com/store/en-US/p/" + el.productSlug,
                imageURL: imagesGetThumbnail[0]?.url,
                startDate: startDateRAW.format("DD/MM/YY"),
                endDate: endDateRAW.format("DD/MM/YY"),
                startDateDiffernce: moment(startDateRAW).diff(moment(), "days"),
                endDateDiffernce: moment(endDateRAW).diff(moment(), "days"),
              });
            }
          }
        });

        if (arg === "latest") {
          resolve(gamesNow);
          return;
        } else if (arg === "future") {
          resolve(gamesLater);
          return;
        }
      })
      .catch((error) => {
        reject(error);
      });
  });

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const prefix = ">";
  if (message.content.startsWith(prefix)) {
    const args = message.content.trim().split(/ +/g);
    const cmd = args[0].slice(prefix.length).toLowerCase();

    if (args[2]) {
      message.reply("No need arguments. Check >epichelp");
      return;
    }

    if (cmd === "epichelp") {
      const embed = new MessageEmbed()
        .setColor("#f2f2f2")
        .setTitle("Epic Games Bot")
        .addFields(
          {
            name: "Help section (this section)",
            value: ">epichelp",
          },
          {
            name: "Latest games",
            value: ">game latest",
          },
          {
            name: "Future games",
            value: ">game future",
          }
        )
        .setFooter("Made by eliac7#5541");
      message.reply({ embeds: [embed] });
    } else if (cmd === "game") {
      const commands = ["future", "latest"];
      if (!commands.includes(args[1]))
        message.reply("No available argument. Check >epichelp.");

      if (args[1] === "latest" || args[1] === "future") {
        getGames(args[1]).then((res) => {
          res.forEach(function (i) {
            let fieldText = args[1] === "latest" ? "Started on" : "Starts on";

            let startDate;

            if (args[1] === "latest") {
              if (i.startDateDiffernce === 0) {
                startDate = "Started today";
              } else {
                startDate = `${i.startDate} (${Math.abs(
                  i.startDateDiffernce
                )} day(s) ago)`;
              }
            } else {
              if (i.startDateDiffernce === 0) {
                startDate = "Starting today";
              } else {
                if (i.startDateDiffernce > 1) {
                  startDate = `${i.startDate}  ( In ${i.startDateDiffernce} days )`;
                } else {
                  startDate = `${i.startDate}  ( In ${i.startDateDiffernce} day )`;
                }
              }
            }

            const embed = new MessageEmbed()
              .setColor("#f2f2f2")
              .setTitle(i.title)
              .setURL(i.productURL)
              .setDescription(i.description)
              .addFields(
                {
                  name: fieldText,
                  value: startDate,
                  inline: true,
                },
                {
                  name: "Ends on",
                  value: `${i.endDate} ${
                    i.endDateDiffernce > 1
                      ? `( In ${i.endDateDiffernce} days )`
                      : `( In ${i.endDateDiffernce} day )`
                  }`,
                  inline: true,
                }
              )

              .setImage(i.imageURL)
              .setTimestamp()
              .setFooter("Made by eliac7#5541");
            message.reply({ embeds: [embed] });
          });
        });
      }
    } else {
      message.reply("No available command. Check >epichelp.");
    }
  }
});

client.login(process.env.CLIENT_TOKEN);
