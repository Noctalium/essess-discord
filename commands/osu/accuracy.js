const sqlLib = require('../../lib/sqlLib');
const osuApi = require('../../lib/osuApi');
const utils = require('../../lib/utils');
const Discord = require('discord.js');

const { prefix } = require('../../config.json');
const { getColorFromURL } = require('color-thief-node');

module.exports = {
    name: 'accuracy',
    description: '`??acc [username] [-p {page}]` - Give a list of the best maps to fix accuracy on to make your global accuracy go up faster.',
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
                    username = args[i];
                }
            }
        }

        let user = await osuApi.getUser({u: username, m: 2});
        if(user.length == 0) {
            return message.channel.send(':x: This user do not exist.');
        }
        
        let embed = 0

    }
}

async function generateEmbed(scoresDiff, topScores, user, cAccScores, offset = 0) {
    
}

async function formatScores(scores) {

    let formatScores = [];

    for(let i = 0; i < scores.length; i++) {
        let score = scores[i];

        let accuracy = utils.getAccuracy(score.count300, score.count100, score.count50, score.countmiss, score.countkatu);

        formatScores.push({id: score.beatmap_id, accuracy: accuracy});
    }

    return formatScores;
}

async function getAccDiff(scores, index, gAcc) {
    let scoresCopy = JSON.parse(JSON.stringify(scores));
    scoresCopy[index].accuracy = 1;

    // Recalculate PP value and reset the scoresCopy
    let newPPValue = 0;


    let newGlobalAcc = await utils.getGlobalAcc(scoresCopy);

    return {diff: newGlobalAcc - gAcc, newGlobalAcc: newGlobalAcc};
}

async function getAllAccDifferences(scores) {
    let accDiffs = [];

    let gAcc = await utils.getGlobalAcc(scores);

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