const axios = require("axios");
const moment = require("moment");
const { Client, Intents, MessageEmbed } = require("discord.js");
const client = new Client({
  intents: [Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILDS],
});
require("dotenv").config();

const url =
  "https://store-site-backend-static-ipv4.ak.epicgames.com/freeGamesPromotions";

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setActivity(">epichelp", { type: "PLAYING" });
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
              el.promotions.promotionalOffers.length > 0
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
                  "https://www.epicgames.com/store/en-US/p/" + el.urlSlug,
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
                  "https://www.epicgames.com/store/en-US/p/" + el.urlSlug,
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
      const help_embed = new MessageEmbed()
        .setColor("#f2f2f2")
        .setTitle("Epic Games Bot")
        .addFields({
          name: "Usage",
          value: 'Type ">latest" to get the latest 3 games.',
        })
        .setFooter("Made by eliac7#5541");
      message.reply({ embeds: [help_embed] });
    } else if (cmd === "game") {
      const commands = ["future", "latest"];
      if (!commands.includes(args[1]))
        message.reply("No available argument. Check >epichelp.");

      if (args[1] === "latest" || args[1] === "future") {
        getGames(args[1]).then((res) => {
          res.forEach(function (i) {
            let fieldText = args[1] === "latest" ? "Started on" : "Starts on";

            let startDate =
              args[1] === "latest"
                ? `${i.startDate} (${Math.abs(
                    i.startDateDiffernce
                  )} day(s) ago)`
                : `${i.startDate} ( In ${i.startDateDiffernce} day(s) )`;

            const help_embed = new MessageEmbed()
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
                  value: `${i.endDate} ( In ${i.endDateDiffernce} day(s) )`,
                  inline: true,
                }
              )

              .setImage(i.imageURL)
              .setTimestamp()
              .setFooter("Made by eliac7#5541");
            message.reply({ embeds: [help_embed] });
          });
        });
      }
    } else {
      message.reply("No available command. Check >epichelp.");
    }
  }
});

client.login(process.env.CLIENT_TOKEN);
