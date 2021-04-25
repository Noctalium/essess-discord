const Discord = require('discord.js');
const { getColorFromURL } = require('color-thief-node');
const sqlLib = require('../../lib/sqlLib');

const { osuApiToken } = require('../../config.json');

const osu = require('node-osu');
const osuApi = new osu.Api(osuApiToken, {
    notFoundAsError: false,
	completeScores: false,
	parseNumeric: false
});

module.exports = {
    name: 'misscount',
    description: 'Count the number of chokes you have in your top 100 pp play.',
    async execute(message, args) {

        if(args.length >= 2) {
            return message.channel.send(`:x: Please only enter 1 username.`); 
        }

        let username = await sqlLib.getLinkedUser(message.author.id);

        if(args.length == 1) {
            username = args[0];
        }

        let user = await osuApi.getUser({u: username, m: 2});
        let userBest = await osuApi.getUserBest({u: username, m: 2, limit: 100});

        let missArray = [];
        let dropmissArray = [];

        for(let i = 0; i < userBest.length; i++) {
            let score = userBest[i];
            if(score.counts.miss > 0) missArray.push(parseInt(score.counts.miss));
            if(score.counts.katu > 0) dropmissArray.push(parseInt(score.counts.katu));
        }
        
        let avgMiss = (missArray.reduce((a,b) => (a+b)) / 100);
        let avgDrop = (dropmissArray.reduce((a,b) => (a+b)) / 100);

        let msg = `**${user.name}**:
- Out of the whole top 100 plays:
Avg. Miss: ${avgMiss.toFixed(2)}
Avg. Drop: ${avgDrop.toFixed(2)}
- Out of the ${missArray.length} non-fc plays:
Avg. Miss: ${missArray.reduce((a,b) => (a+b)) / missArray.length}
Avg. Drop: ${dropmissArray.reduce((a,b) => (a+b)) / dropmissArray.length}
`;

        return message.channel.send(msg);
    }
}