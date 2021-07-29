const sqlLib = require('../../lib/sqlLib');
const osuApi = require('../../lib/osuApi');
const utils = require('../../lib/utils');
const Discord = require('discord.js');

const fetch = require('node-fetch');

const { prefix } = require('../../config.json');
const { getColorFromURL } = require('color-thief-node');

module.exports = {
    name: 'score',
    description: `\`${prefix}score [username] {beatmap link / id}\`, \`${prefix}s [username] {beatmap link / id}\` - Show user's scores on the given beatmap.`,
    async execute(message, args) {
        if(args.length > 2 || args.length == 0) {
            return message.channel.send(`:x: Please use \`${prefix}score [username] {beatmap id/link}\``);
        }

        let username = await sqlLib.getLinkedUser(message.author.id);
        if(username == null) {
            return message.channel.send(`:x: Please link your osu! profile first with \`${prefix}osuset (username)\`.`);
        }

        let beatmapId = -1;
        for(let i = 0; i < args.length; i++) {
            if(args[i].startsWith('https://') || args[i].startsWith('http://') || !isNaN(args[i])) {
                let linkArray = args[i].split("/");
                beatmapId = linkArray[linkArray.length - 1];
            }
            else {
                username = args[i];
            }
        }

        let user = await osuApi.getUser({u: username, m: 2});
        if(user.length == 0) {
            return message.channel.send(':x: This user do not exist.');
        }

        let beatmap = await osuApi.getBeatmaps({b: beatmapId, m:2, a:1});
        if(beatmap.length == 0) {
            return message.channel.send(':x: This beatmap do not exist.')
        }
        if(beatmap[0].approvalStatus != 'Ranked' && beatmap[0].approvalStatus != 'Loved' && beatmap[0].approvalStatus != 'Approved') {
            return message.channel.send(':x: This beatmap do not have any leaderboard, so no scores have been found.');
        }
        
        let scores = await osuApi.getScores({b: beatmapId, u: user.id, m:2});
        if(scores.length == 0) {
            return message.channel.send(`:x: No play found for **${user.name}** on **${beatmap[0].title} [${beatmap[0].version}]**.`);
        }

        let si = await utils.fillServerInfoDb(beatmap, message);

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
    
        embed.setDescription(content);
    
        return embed;
}