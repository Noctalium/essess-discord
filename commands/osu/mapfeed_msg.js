const sqlLib = require('../../lib/sqlLib');
const osuApi = require('../../lib/osuApi');
const utils = require('../../lib/utils');
const Discord = require('discord.js');

const fetch = require('node-fetch');

const { prefix } = require('../../config.json');
const { getColorFromURL } = require('color-thief-node');

module.exports = {
    name: 'mapfeed_msg',
    description: '',
    async execute(channel, maps, channel_id = 0) {
        let beatmapSets = [];

        for(i = 0; i < maps.length; i++) {
            map = maps[i];

            // Check if map is ranked or loved
            if(map.approvalStatus == 'Ranked' || map.approvalStatus == 'Loved') {
                if(!beatmapSets.includes(parseInt(map.beatmapSetId))) beatmapSets.push(parseInt(map.beatmapSetId));
            }
        }

        for(j = 0; j < beatmapSets.length; j++) {
            setId = beatmapSets[j];

            mapset = await osuApi.getBeatmaps({ m:2, s: setId });

            sortedMapset = mapset.sort((a, b) => (a.difficulty.rating > b.difficulty.rating) ? 1 : -1);

            let embed = await generateEmbed(sortedMapset);
            channel.send(embed);
        }
    }
}

async function generateEmbed(beatmap_set) {
    let beatmapThumbnailUrl = `https://b.ppy.sh/thumb/${beatmap_set[0].beatmapSetId}l.jpg`; 
    let beatmapUrl = `https://osu.ppy.sh/beatmapsets/${beatmap_set[0].beatmapSetId}#fruits/`;

    const resp = await fetch(beatmapThumbnailUrl, {
        method: 'HEAD'
    });

    let title = ``;
    if(beatmap_set[0].approvalStatus == "Ranked") {
        title = `:star2: New ranked beatmap !`;
    } else {
        title = `:heart: New loved beatmap !`;
    }

    let content = `**[${beatmap_set[0].artist} - ${beatmap_set[0].title}](${beatmapUrl})**
    `;

    for(i = 0; i < beatmap_set.length; i++) {
        let map = beatmap_set[i];
        let difficultyEmote = await utils.getDifficultyEmotes(map.difficulty.rating);

        let tmp = `
        **${difficultyEmote} ${map.version} [${Math.round(map.difficulty.rating * 100) / 100}★]** CS: ${map.difficulty.size} | AR: ${map.difficulty.approach} | HP: ${map.difficulty.drain}
        ▸ **${await utils.getPp(100, map.difficulty.rating, map.difficulty.approach, map.maxCombo)}pp** for a NoMod SS | Beatmap ID: ${map.id}
        `;

        content += tmp;
    }

    let embed = new Discord.MessageEmbed()
        .setTitle(title)
        .setDescription(content)
        .setFooter(` ▸ Beatmap set by ${beatmap_set[0].creator}`);

    if(resp.ok == true) {
        let color = await getColorFromURL(beatmapThumbnailUrl);

        embed.setThumbnail(beatmapThumbnailUrl)
             .setColor(color);
    } else {
        embed.setColor('#71368A');
    }

    return embed;
}