const sqlLib = require('../../lib/sqlLib');
const osuApi = require('../../lib/osuApi');
const utils = require('../../lib/utils');
const Discord = require('discord.js');

const fetch = require('node-fetch');

const { prefix } = require('../../config.json');
const { getColorFromURL } = require('color-thief-node');

module.exports = {
    name: 'topplay',
    description: '`??top [username]`, `??ctbtop [username]` - Show user\'s best pp plays.',
    async execute(message, args) {
        if(args.length > 2) {
            return message.channel.send(':x: Wrong synthax, please use `??top [username] (-recent)`.');
        }

        let username = await sqlLib.getLinkedUser(message.author.id);
        if(username == null) {
            return message.channel.send(`:x: Please link your osu! profile first with \`${prefix}osuset (username)\`.`);
        }

        let recentFilter = false;
        if(args.length > 0) {
            for(let i = 0; i < args.length; i++) {
                if(args[i].toLowerCase() == '-r' || args[i].toLowerCase() == '-recent') {
                    recentFilter = true;
                }
                else {
                    username = args[i];
                }
            }
        }

        let user = await osuApi.getUser({u: username, m: 2});
        if(user.length == 0) {
            return message.channel.send(':x: This user do not exist.');
        }

        let topScores = await osuApi.getUserBest({u: user.id, m:2, limit: 100});
        if(topScores.length == 0) {
            return message.channel.send(':x: This user do not have any plays in Catch The Beat!');
        }

        if(recentFilter) {
            let count = 1;
            topScores.forEach(el => {
                el.index = count;
                count++;
            });

            sortedTopPlays = topScores.sort((a, b) => new Date(b.raw_date) - new Date(a.raw_date));
            topScores = sortedTopPlays.slice(0, 5);
        } else {
            topScores = topScores.slice(0, 5);
        }

        let embed = await generateEmbed(user, topScores, recentFilter);
        return message.channel.send(embed);
    }
}

async function generateEmbed(user, topPlays, recentFilter) {
    let profilePic = await utils.getProfilePictureUrl(user.id);
    let color = await getColorFromURL(profilePic);

    let title = ``;

    if(recentFilter) {
        title = `:flag_${user.country.toLowerCase()}: Most recent top plays for ${user.name}`;
    }
    else {
        title = `:flag_${user.country.toLowerCase()}: Top plays for ${user.name} in Catch The Beat!`;
    }

    let content = `**${user.pp.raw}pp** | **${Math.round(user.accuracy * 100) / 100}%**
    `;

    for(let i = 0; i < topPlays.length; i++) {
        let score = topPlays[i];

        let rankEmote = await utils.getRankEmotes(score.rank);

        let beatmap = await osuApi.getBeatmaps({b: score.beatmapId, m: 2, a:1});
        beatmap = beatmap[0];

        let beatmapUrl = `https://osu.ppy.sh/beatmapsets/${beatmap.beatmapSetId}#fruits/${beatmap.id}`;

        let accuracy = await utils.getAccuracy(score.counts['300'], score.counts['100'], score.counts['50'], score.counts.miss, score.counts.katu);
    
        let enabledMods = ``;
        if(score.raw_mods != 0) {
            enabledMods = `+ **${await utils.getMods(score.raw_mods)}**`;
        }

        let maxCombo = `x${score.maxCombo}/${beatmap.maxCombo}`
        if(score.maxCombo == beatmap.maxCombo) {
            maxCombo = `**x${score.maxCombo}/${beatmap.maxCombo}**`
        }

        if(recentFilter) {
            nbScore = score.index;
        }
        else {
            nbScore = i+1;
        }

        let tmp = `
        **${nbScore}. [${beatmap.title} [${beatmap.version}]](${beatmapUrl})** [${Math.round(beatmap.difficulty.rating*100)/100}★] ${enabledMods}
        - ${rankEmote} ▸ **${Math.round((score.pp)*100)/100}pp** ▸ ${accuracy} | ${score.raw_date.substring(0,10)}
        - ${score.score} ▸ ${maxCombo} | Miss: ${score.counts.miss}, Dropmiss: ${score.counts.katu}
        `;

        content += tmp;
    }

    return new Discord.MessageEmbed()
    .setThumbnail(profilePic)
    .setColor(color)
    .setTitle(title)
    .setURL(`https://osu.ppy.sh/users/${user.id}`)
    .setDescription(content);
}