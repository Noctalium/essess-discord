const osuApi = require('../../lib/osuApi');
const utils = require('../../lib/utils');
const Discord = require('discord.js');

const fetch = require('node-fetch');

const { getColorFromURL } = require('color-thief-node');
const sqlLib = require('../../lib/sqlLib');

module.exports = {
    name: 'pp_tracking_msg',
    description: '',
    async execute(trackedUser, client) {

        let user = await osuApi.getUser({u: trackedUser.user_id, m: 2});
        if(user.length == 0) {
            // If user is not found, that mean user has been restricted, so we delete it
            await sqlLib.deleteTrackedUser(trackedUser.user_id);
        }

        let channelsCopy = trackedUser.channels;
        let channelsArray = trackedUser.channels.split('|');
        let embed = null;

        if(trackedUser.current_pp != user.pp.raw) {
            let userBest = await osuApi.getUserBest({u: trackedUser.user_id, m:2, limit: 100});
            for(i = 0; i < userBest.length; i++) {
                score = userBest[i];

                if(new Date(score.raw_date) > new Date(trackedUser.last_check)) {

                    let beatmap = await osuApi.getBeatmaps({b: score.beatmapId, m: 2, a:1});
                    embed = await generateEmbed(user, beatmap[0], score, trackedUser, i + 1);

                    for(j = 0; j < channelsArray.length; j++) {
                        if(channelsArray[j] != "") {
                            let chann = client.channels.cache.get(channelsArray[j]);

                            if(typeof chann === 'undefined') {
                                channelsCopy = channelsCopy.replace(`${channelsArray[j]}|`, '');
                                await sqlLib.updateTrackedUser(user, channelsCopy, 0);
                            } else {
                                chann.send(embed);
                            }
                        }
                    }
                }
            }
            await sqlLib.updateTrackedUser(user, trackedUser.channels);
        }
    }
}

async function generateEmbed(user, beatmap, score, trackedUser, playRank) {
    let beatmapThumbnailUrl = `https://b.ppy.sh/thumb/${beatmap.beatmapSetId}l.jpg`; 
    let beatmapUrl = `https://osu.ppy.sh/beatmapsets/${beatmap.beatmapSetId}#fruits/${beatmap.id}`

    const resp = await fetch(beatmapThumbnailUrl, {
        method: 'HEAD'
    });

    let profilePic = await utils.getProfilePictureUrl(user.id);

    let rankEmote = await utils.getRankEmotes(score.rank);
    let difficultyEmote = await utils.getDifficultyEmotes(beatmap.difficulty.rating);
    let enabledMods = await utils.getMods(score.raw_mods);
    let accuracy = await utils.getAccuracy(score.counts['300'], score.counts['100'], score.counts['50'], score.counts.miss, score.counts.katu);

    let ppDiff = parseFloat(user.pp.raw) - parseFloat(trackedUser.current_pp);
    ppDiff = Math.round((ppDiff) * 100) / 100;

    if(Math.sign(ppDiff) == 1) ppDiff = `+${ppDiff}`;

    let accDiff = parseFloat(user.accuracy) - parseFloat(trackedUser.current_acc);
    accDiff = Math.round((accDiff) * 100) / 100;

    if(Math.sign(accDiff) == 1) accDiff = `+${accDiff}`;

    let now = Date.now();
    let playDate = new Date(score.raw_date);

    let content = `
    **${difficultyEmote} [${beatmap.title} [${beatmap.version}]](${beatmapUrl})**
    ▸ ${rankEmote} ▸ **${Math.round(accuracy*100)/100}%** ▸ **${Math.round((score.pp)*100)/100}pp**
    ▸ **[${Math.round(beatmap.difficulty.rating*100)/100}★]** + ${enabledMods} | Miss: ${score.counts.miss}, Dropmiss: ${score.counts.katu}
    ▸ ${score.score} ▸ ${score.maxCombo}/${beatmap.maxCombo} [${score.counts['300']}/${score.counts['100']}/${score.counts['50']}/${score.counts.miss}]
    ▸ ${trackedUser.current_pp}pp → **${user.pp.raw}(${ppDiff})pp** | ${Math.round((trackedUser.current_acc)*100)/100}% → **${Math.round((user.accuracy)*100)/100}%**
    ▸ #${trackedUser.current_rank} → **#${user.pp.rank}** (${user.country}#${trackedUser.current_crank} → **#${user.pp.countryRank}**)
    `;

    let embed = new Discord.MessageEmbed()
        .setAuthor(
            `New #${playRank} for ${user.name} in Catch The Beat!`,
            `${profilePic}`,
            `https://osu.ppy.sh/users/${user.id}`
        )
        .setDescription(content)
        .setFooter(`${await utils.secToDhms((now - playDate)/1000)} ago | Beatmap by ${beatmap.creator} | ID: ${beatmap.id}`);
    
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