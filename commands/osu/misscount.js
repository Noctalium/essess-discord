const sqlLib = require('../../lib/sqlLib');
const osuApi = require('../../lib/osuApi');
const utils = require('../../lib/utils');
const Discord = require('discord.js');

const { prefix } = require('../../config.json');
const { getColorFromURL } = require('color-thief-node');

module.exports = {
    name: 'misscount',
    description: `\`${prefix}misscount [username]\` - Count user's average miss and dropmiss in their top 100 pp plays.`,
    async execute(message, args) {

        if(args.length >= 2) {
            return message.channel.send(`:x: Please only enter 1 username.`); 
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
        if(userBest.length == 0) {
            return message.channel.send(':x: This user do not have any Catch The Beat scores.');
        }

        let missArray = [];
        let dropmissArray = [];

        for(let i = 0; i < userBest.length; i++) {
            let score = userBest[i];
            if(score.counts.miss > 0) missArray.push(parseInt(score.counts.miss));
            if(score.counts.katu > 0) dropmissArray.push(parseInt(score.counts.katu));
        }
        
        let avgMiss = (missArray.reduce((a,b) => (a+b)) / 100);
        let avgDrop = (dropmissArray.reduce((a,b) => (a+b)) / 100);

        let profilePic = await utils.getProfilePictureUrl(user.id);

        let embed = new Discord.MessageEmbed()
            .setTitle(`Average drop/miss for ${user.name}`)
            .setURL(`https://osu.ppy.sh/users/${user.id}`)
            .setThumbnail(profilePic)
            .setColor(await getColorFromURL(profilePic))
            .setDescription(`
            >> Out of the whole top ${userBest.length} plays:
                **Avg. Miss:** ${avgMiss.toFixed(2)}
                **Avg. Drop:** ${avgDrop.toFixed(2)}

            >> Out of the **${missArray.length} non-fc** plays:
                **Avg. Miss:** ${(missArray.reduce((a,b) => (a+b)) / missArray.length).toFixed(2)}
                **Avg. Drop:** ${(dropmissArray.reduce((a,b) => (a+b)) / dropmissArray.length).toFixed(2)}
            `)

        return message.channel.send(embed);
    }
}