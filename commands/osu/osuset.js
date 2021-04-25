const sqlLib = require('../../lib/sqlLib');
const osuApi = require('../../lib/osuApi');

const { prefix } = require('../../config.json');

module.exports = {
    name: 'osuset',
    description: '`??osuset {username}` - Link your discord account with your osu! account.',
    async execute(message, args) {
        if(args.length == 0 || args.length > 1) {
            return message.channel.send(`:x: Please use \`${prefix}osuset (username)\`.`);
        }

        let user = await osuApi.getUser({u: args[0], m: 2});
        if(user.length == 0) {
            return message.channel.send(':x: This user do not exist.');
        }

        let username = await sqlLib.getLinkedUser(message.author.id);

        if(username == null) {
            let insert = await sqlLib.linkUser(message.author.id, user.id);
            if(insert) return message.channel.send(`:white_check_mark: Your osu! username has been set to **${user.name}**`);
        } else {
            let update = await sqlLib.updateLinkedUser(message.author.id, user.id);
            if(update) return message.channel.send(`:white_check_mark: Your osu! username has been updated to **${user.name}**`);
        }
    }
}