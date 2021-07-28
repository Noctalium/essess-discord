const sqlLib = require('../../lib/sqlLib');
const osuApi = require('../../lib/osuApi');
const utils = require('../../lib/utils');
const Discord = require('discord.js');

const fetch = require('node-fetch');

const { prefix } = require('../../config.json');
const { getColorFromURL } = require('color-thief-node');

module.exports = {
    name: 'compare',
    description: '`??compare [username]`, `??c [username]` - Check username\'s scores on the last beatmap displayed with the `??recent` command.',
    async execute(message, args) {
        if(args.length > 1) {
            return message.channel.send(':x: Please only enter 1 username.');
        }

        let username = await sqlLib.getLinkedUser(message.author.id);
        if(username == null) {
            return message.channel.send(`:x: Please link your osu! profile first with \`${prefix}osuset (username)\`.`);
        }

        if(args.length == 1) {
            username = args[0];
        }

        let user = await osuApi.getUser({u: username, m: 2});
        if(user.length == 0) {
            return message.channel.send(':x: This user do not exist.');
        }

        let noIdMessage = `:x: No scores to compare to, please use \`${prefix}recent\` or \`${prefix}score {beatmap URL}\`.`;

        let beatmapId = await sqlLib.getServerInfo(message.channel.id);
        if(beatmapId == null) {
            return message.channel.send(noIdMessage)
        }
        let beatmap = await osuApi.getBeatmaps({b: beatmapId, m: 2, a:1});

        let scores = await osuApi.getScores({b: beatmapId, u: user.id, m:2});
        if(scores.length == 0) {
            return message.channel.send(`:x: No play found for **${user.name}** on **${beatmap[0].title} [${beatmap[0].version}]**.`);
        }

        let embed = await generateEmbed(user, scores, beatmap[0]);
        return message.channel.send(embed);
    }
}

async function generateEmbed(user, scores, beatmap, offset = 0) {
    let profilePic = await utils.getProfilePictureUrl(user.id);
    let beatmapThumbnailUrl = `https://b.ppy.sh/thumb/${beatmap.beatmapSetId}l.jpg`; 

    const resp = await fetch(beatmapThumbnailUrl, {
        method: 'HEAD'
    });

    let scorePerPage = scores.length >= 8 ? 8 : scores.length;

    let embed = new Discord.MessageEmbed();

    let content = ``;

    if(resp.ok == true) {
        let color = await getColorFromURL(beatmapThumbnailUrl);
        embed.setThumbnail(beatmapThumbnailUrl)
             .setColor(color);
    } else {
        embed.setColor('#71368A');
    }

    embed.setAuthor(`Top plays for ${user.name} on ${beatmap.title} [${beatmap.version}]`,
    `${profilePic}`,
    `https://osu.ppy.sh/beatmapsets/${beatmap.beatmapSetId}#fruits/${beatmap.id}`)
         .setFooter(`Beatmap by ${beatmap.creator} | ID: ${beatmap.id}`);

    for(let i = 0; i < scorePerPage; i++) {
        let scoreIndex = i + offset;
        let score = scores[scoreIndex];

        let roundedPp = Math.round(score.pp * 100) / 100;
        let accuracy = await utils.getAccuracy(score.counts['300'], score.counts['100'], score.counts['50'], score.counts.miss, score.counts.katu);
        
        let tmp = `
        **▸** \`${await utils.getMods(score.raw_mods)}\` : ${await utils.getRankEmotes(score.rank)} - **${roundedPp}pp** - ${Math.round(accuracy * 100) / 100}% | ${score.raw_date.substring(0,10)}
        **·** ${score.score} - ${score.maxCombo}/${beatmap.maxCombo} - Miss: ${score.counts.miss}, Dropmiss: ${score.counts.katu}
        `;

        content += tmp;
    }

    embed.setDescription(content)

    return embed;
}