const sqlLib = require('../../lib/sqlLib');
const osuApi = require('../../lib/osuApi');
const utils = require('../../lib/utils');
const Discord = require('discord.js');

const { prefix } = require('../../config.json');
const { getColorFromURL } = require('color-thief-node');

module.exports = {
    name: 'accuracy',
    description: `\`${prefix}acc [username] [-p {page}]\` - Give a list of user's best play to fix to increase their global accuracy faster.`,
    async execute(message, args) {
        let filter = 1; // Default page is 1

        let username = await sqlLib.getLinkedUser(message.author.id);
        if(username == null) {
            return message.channel.send(`:x: Please link your osu! profile first with \`${prefix}osuset (username)\`.`);
        }

        if(args.length > 0) {
            for(let i = 0; i < args.length; i++) {
                if(args[i].toLowerCase() == '-p') {
                    filter = args[i+1]; 
                }
                else {
                    if(args[i-1] != '-p') username = args[i];
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

        let formattedScores = await formatScores(topScores);

        let globalAcc = await utils.getGlobalAcc(formattedScores);

        let scoresDiff = await getAllAccDifferences(formattedScores, globalAcc);

        let embed = await generateEmbed(scoresDiff, topScores, user, formattedScores, filter);
        return message.channel.send(embed);
    }
}

async function generateEmbed(scoresDiff, topScores, user, cAccScores, offset = 0) {
    let profilePic = await utils.getProfilePictureUrl(user.id);
    let color = await getColorFromURL(profilePic);

    // offset = page that user want to see (5 scores per pages)

    if(offset > 0) {
        for(let i = 0; i < (offset - 1) * 5; i++) {
            scoresDiff.shift();
        } 
    }

    // In case there is less than 5 scores to show on the given page
    let scorePerPage = scoresDiff.length >= 5 ? 5 : scoresDiff.length;
    let rankNumber = (offset - 1) * 5;

    let embed = new Discord.MessageEmbed()
        .setThumbnail(profilePic)
        .setColor(color);

    
    let content = `**Current global accuracy:** ${Math.round(user.accuracy*10000) / 10000}%
    `;

    // Check if user already have an SS everywhere
    if(scoresDiff.length == 0 && parseInt(user.accuracy) == 100) {
        let tmp = `
        **Congratulation, ${user.name} have nothing to fix, they SS'd every plays in their top 100 scores !**
        `;

        content += tmp;
    }

    for(let i = 0; i < scorePerPage; i++) {
        rankNumber = rankNumber + 1;

        let beatmap = await osuApi.getBeatmaps({b: scoresDiff[i].map, m: 2, a:1});
        let beatmapUrl = `https://osu.ppy.sh/beatmapsets/${beatmap[0].beatmapSetId}#fruits/${beatmap[0].id}`;

        let actualScore = cAccScores.find(el => el.id == beatmap[0].id);
        let actualDropletMissNumber = topScores.find(el => el.beatmapId == beatmap[0].id).counts.katu;
        let actualMissNumber = topScores.find(el => el.beatmapId == beatmap[0].id).counts.miss;
        let actualPlayMods = topScores.find(el => el.beatmapId == beatmap[0].id).raw_mods;

        let accuracy = actualScore.accuracy;
        let newGlobalAcc = scoresDiff[i].newGlobalAcc;

        let tmp = `
        **${rankNumber}. [${beatmap[0].title} [${beatmap[0].version}]](${beatmapUrl})** [${Math.round(beatmap[0].difficulty.rating*100)/100}★] + **${await utils.getMods(actualPlayMods)}**
        **\\-** Actual acc: ${Math.round(accuracy * 100) / 100}% | ${actualDropletMissNumber} drop(s) miss(es), ${actualMissNumber} miss(es).
        ** ► Global acc after SS: ${Math.round(newGlobalAcc * 10000) / 10000}%**
        `;

        content += tmp;
    }

    embed.setDescription(content)
         .setFooter(`Page ${offset} | use '??acc [username] -p {number}' to see the other page`);

    return embed;
}

async function formatScores(scores) {
    let formatScores = [];

    for(let i = 0; i < scores.length; i++) {
        let score = scores[i];

        let accuracy = await utils.getAccuracy(score.counts['300'], score.counts['100'], score.counts['50'], score.counts.miss, score.counts.katu);
    
        formatScores.push({id: score.beatmapId, accuracy: accuracy});
    }
    return formatScores;
}

async function getAccDiff(scores, index, gAcc) {
    let scoresCopy = JSON.parse(JSON.stringify(scores));

    scoresCopy[index].accuracy = 100;

    let newGlobalAcc = await utils.getGlobalAcc(scoresCopy);
    return {diff: newGlobalAcc - gAcc, newGlobalAcc: newGlobalAcc};
}

async function getAllAccDifferences(scores, gAcc) {
    let accDiffs = [];

    for(let i = 0; i < scores.length; i++) {
        let accD = await getAccDiff(scores, i, gAcc);
        if(accD.diff > 0) 
            accDiffs.push({diff: accD.diff, map: scores[i].id, newGlobalAcc: accD.newGlobalAcc});
    }

    accDiffs.sort((a, b) => {
        if(a.diff < b.diff)
            return 1;
        else if(a.diff > b.diff)
            return -1;
        else
            return 0;
    });

    return accDiffs.slice(0, 100);
}