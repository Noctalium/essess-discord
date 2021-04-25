const sqlLib = require('../../lib/sqlLib');
const osuApi = require('../../lib/osuApi');
const utils = require('../../lib/utils');
const Discord = require('discord.js');

const { prefix } = require('../../config.json');
const { getColorFromURL } = require('color-thief-node');

module.exports = {
    name: 'recent',
    description: '`??recent [username]`, `??rs [username]` - Show user\'s ctb profile.',
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

        let userRecent = await osuApi.getUserRecent({u: username, m: 2, limit: 1});
        if(userRecent.length == 0) {
            return message.channel.send(`**${user.name}** hasn't done anything in the last 24 hours.`)
        }

        let mods = userRecent[0].raw_mods & 338;
        let beatmap = await osuApi.getBeatmaps({b: userRecent[0].beatmapId, m: 2, a:1, mods: mods});

        let embed = await generateEmbed(userRecent[0], beatmap[0], user);
        return message.channel.send(embed);
    }
}

async function generateEmbed(score, beatmap, user) {
    let beatmapThumbnailUrl = `https://b.ppy.sh/thumb/${beatmap.beatmapSetId}l.jpg`; 
    let color = await getColorFromURL(beatmapThumbnailUrl);

    let rankEmote = await utils.getRankEmotes(score.rank);
    let enabledMods = await utils.getMods(score.raw_mods);

    let accuracy = await utils.getAccuracy(score.counts['300'], score.counts['100'], score.counts['50'], score.counts.miss, score.counts.katu);
    let ppValue = await utils.getPp(accuracy, beatmap.difficulty.rating, beatmap.difficulty.approach, beatmap.maxCombo, score.raw_mods, score.counts.miss, score.maxCombo);

    let now = Date.now()
    let playDate = new Date(score.raw_date);

    let embed = new Discord.MessageEmbed()
        .setThumbnail(beatmapThumbnailUrl)
        .setColor(color)
        .setAuthor(
            `${beatmap.title} [${beatmap.version}] + ${enabledMods} [${Math.round(beatmap.difficulty.rating*100)/100}★]`,
            `http://s.ppy.sh/a/${user.id}`,
            `https://osu.ppy.sh/beatmapsets/${beatmap.beatmapSetId}#fruits/${beatmap.id}`
        )
        .setDescription(`
            **· ${rankEmote} - ${ppValue}pp -** ${Math.round(accuracy*100)/100}% - Miss: ${score.counts.miss}, Dropmiss: ${score.counts.katu}
            **·** ${score.score} - ${score.maxCombo}/${beatmap.maxCombo} - [${score.counts['300']}/${score.counts['100']}/${score.counts['50']}/${score.counts.miss}]
            `)
        .setFooter(`${await utils.secToDhms((now - playDate)/1000)} ago | Beatmap by ${beatmap.creator} | ID: ${beatmap.id}`)
    
    return embed;
}