const sqlLib = require('../../lib/sqlLib');
const osuApi = require('../../lib/osuApi');

const { prefix } = require('../../config.json');

module.exports = {
    name: '1miss',
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

        let userBest = await osuApi.getUserBest({u: username, m: 2, limit: 100});

        let oneMissCount = 0;
        for(let i = 0; i < userBest.length; i++) {
            let score = userBest[i];
            if(parseInt(score.counts.miss) === 1) {
                oneMissCount++;
            }
        }

        let msg = `**${user.name}** has **${oneMissCount}x** 1miss play(s) in his Top PP plays.`;
        return message.channel.send(msg)
    }
}

