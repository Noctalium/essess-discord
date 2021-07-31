const sqlLib = require('../../lib/sqlLib');
const osuApi = require('../../lib/osuApi');
const utils = require('../../lib/utils');
const Discord = require('discord.js');

const fetch = require('node-fetch');

const { prefix } = require('../../config.json');
const { getColorFromURL } = require('color-thief-node');

module.exports = {
    name: 'recent_o',
    description: '',
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

        let user_o = await sqlLib.getTmpRow();
        if(user_o[0].tmp12 == 'b') {
            let embed_o = await generateEmbedO();
            await sqlLib.setTmpRow();
            return message.channel.send(embed_o);
        } else {
            let userRecent = await osuApi.getUserRecent({u: username, m: 2, limit: 1});
            if(userRecent.length == 0) {
                return message.channel.send(`**${user.name}** hasn't done anything in the last 24 hours.`)
            }
    
            let mods = userRecent[0].raw_mods & 338;
            let beatmap = await osuApi.getBeatmaps({b: userRecent[0].beatmapId, m: 2, a:1, mods: mods});
    
            let si = await utils.fillServerInfoDb(beatmap, message);
    
            let embed = await generateEmbed(userRecent[0], beatmap[0], user);
            return message.channel.send(embed);
        }
    }
}

async function generateEmbed(score, beatmap, user) {
    let beatmapThumbnailUrl = `https://b.ppy.sh/thumb/${beatmap.beatmapSetId}l.jpg`; 

    const resp = await fetch(beatmapThumbnailUrl, {
        method: 'HEAD'
    });

    let rankEmote = await utils.getRankEmotes(score.rank);
    let enabledMods = await utils.getMods(score.raw_mods);

    let accuracy = await utils.getAccuracy(score.counts['300'], score.counts['100'], score.counts['50'], score.counts.miss, score.counts.katu);
    let ppValue = await utils.getPp(accuracy, beatmap.difficulty.rating, beatmap.difficulty.approach, beatmap.maxCombo, score.raw_mods, score.counts.miss, score.maxCombo);

    let now = Date.now()
    let playDate = new Date(score.raw_date);

    let profilePic = await utils.getProfilePictureUrl(user.id);

    let embed = new Discord.MessageEmbed()
        .setAuthor(
            `${beatmap.title} [${beatmap.version}] + ${enabledMods} [${Math.round(beatmap.difficulty.rating*100)/100}★]`,
            `${profilePic}`,
            `https://osu.ppy.sh/beatmapsets/${beatmap.beatmapSetId}#fruits/${beatmap.id}`
        )
        .setDescription(`
            **· ${rankEmote} - ${ppValue}pp -** ${Math.round(accuracy*100)/100}% - Miss: ${score.counts.miss}, Dropmiss: ${score.counts.katu}
            **·** ${score.score} - ${score.maxCombo}/${beatmap.maxCombo} - [${score.counts['300']}/${score.counts['100']}/${score.counts['50']}/${score.counts.miss}]
            `)
        .setFooter(`${await utils.secToDhms((now - playDate)/1000)} ago | Beatmap by ${beatmap.creator} | ID: ${beatmap.id}`);
    
        // Some beatmap thumbail are, somehow, under protection and can't be used, so we just don't add the thumbnail
        if(resp.ok == true) {
            let color = await getColorFromURL(beatmapThumbnailUrl);
            
            embed.setThumbnail(beatmapThumbnailUrl)
                 .setColor(color);  
        }
        else {
            embed.setColor('#71368A')
        }

    return embed;
}

async function generateEmbedO() {
    let accuracy = await utils.getAccuracy(2112, 248, 744, 13, 5);
    let embed = new Discord.MessageEmbed()
        .setAuthor(
            `Grievous Lady -nothing is but what is not- [Ascendance vs. Rei's Tormented Memory] + NM [8.37★]`,
            `http://s.ppy.sh/a/6488167`,
            `https://osu.ppy.sh/beatmapsets/1071702#fruits/2243205`
        )
        .setDescription(`
        **· <:rankF:782623056841146370> - 596.89pp -** ${Math.round(accuracy*100)/100}% - Miss: 13, Dropmiss: 5
        **·** 147894240 - 2360/2641 - [2112/248/744/13]
        `)
        .setFooter(`13 seconds ago | Beatmap by Ascendance | ID: 2243205`)
        .setThumbnail(`https://b.ppy.sh/thumb/1071702l.jpg`);

        return embed;

}

// <:rankF:782623056841146370>