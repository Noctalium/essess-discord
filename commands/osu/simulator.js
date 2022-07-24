const sqlLib = require('../../lib/sqlLib');
const utils = require('../../lib/utils');

const { osuApiToken } = require('../../config.json');

const osu = require('node-osu');
const osuApi = new osu.Api(osuApiToken, {
    notFoundAsError: false,
	completeScores: false,
	parseNumeric: false
});

module.exports = {
    name: 'simulator',
    description: 'Simulate stuff in your top100 perf',
    async execute(message, args) {
        if(args.length >= 3) {
            return message.channel.send(`:x: Please only enter 1 username and 1 filter.`); 
        }

        let username = await sqlLib.getLinkedUser(message.author.id);

        if(args.length == 1) {
            username = args[0]
        }

        let user = await osuApi.getUser({u: username, m: 2});
        let userBest = await osuApi.getUserBest({u: username, m: 2, limit: 100});

        let oldPp = user.pp.raw;

        let fcUserBest = [];
        let ssUserBest = [];
        let ogUserBest = [];

        for(let i = 0; i < userBest.length; i++) {
            let score = userBest[i];
            let accuracy = await utils.getAccuracy(score.counts['300'], score.counts['100'], score.counts['50'], score.counts.miss, score.counts.katu);

            let mods = score.raw_mods & 338;
            let beatmap = await osuApi.getBeatmaps({b: score.beatmapId, m: 2, a: 1, mods: mods});

            let fcPp = score.pp;
            if(score.counts.miss != 0) {
                accuracy = await utils.getAccuracy(parseInt(score.counts['300'])+parseInt(score.counts.miss), score.counts['100'], score.counts['50'], 0, score.counts.katu);
                
                fcPp = await utils.getPp(accuracy, beatmap[0].difficulty.rating, beatmap[0].difficulty.approach, beatmap[0].maxCombo, score.raw_mods, 0, beatmap[0].maxCombo);
            }

            let ssPp = await utils.getPp(100, beatmap[0].difficulty.rating, beatmap[0].difficulty.approach, beatmap[0].maxCombo, score.raw_mods, 0, beatmap[0].maxCombo);

            fcUserBest.push({name: beatmap[0].title, pp: parseFloat(fcPp)});
            ssUserBest.push({pp: parseFloat(ssPp)});
            ogUserBest.push({pp: score.pp});

        }

        fcUserBest.sort(function(a, b){return b.pp-a.pp});
        ssUserBest.sort(function(a, b){return b.pp-a.pp});

        let ogGlobalPp = await utils.getGlobalWeightedPp(ogUserBest);
        let fcGlobalPp = await utils.getGlobalWeightedPp(fcUserBest);
        let ssGlobalPp = await utils.getGlobalWeightedPp(ssUserBest);

        let bonusPp = oldPp - ogGlobalPp;

        let msg = `**${user.name}**: ${oldPp}pp (inc. ${bonusPp.toFixed(2)} bonus pp)
Global pp if every plays are FCs : **${(fcGlobalPp + bonusPp).toFixed(2)}pp**
Global pp if every plays are SS  : **${(ssGlobalPp + bonusPp).toFixed(2)}pp**`;

        return message.channel.send(msg);

    }
}