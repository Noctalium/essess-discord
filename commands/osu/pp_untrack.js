const sqlLib = require('../../lib/sqlLib');
const osuApi = require('../../lib/osuApi');

const { prefix } = require('../../config.json');

module.exports = {
    name: 'pp_untrack',
    description: `\`${prefix}untrack {username}\` - (Server admin only) untrack user's new top pp plays.`,
    async execute(message, args) {
        if(!message.member.hasPermission('ADMINISTRATOR')) {
            return message.channel.send(':x: You don\'t have the permissions to do this.')
        }

        if(args.length == 0 || args.length > 1) {
            return message.channel.send(`:x: Please use \`${prefix}untrack (username)\`.`);
        }

        let user = await osuApi.getUser({u: args[0], m: 2});
        if(user.length == 0) {
            return message.channel.send(':x: This user do not exist.');
        }

        let trackedUser = await sqlLib.getTrackedUser(user.id);
        
        if(trackedUser) {
            let channelsArray = trackedUser.channels.split('|');
            if(channelsArray.length > 2) {
                // Update without the given channel id
                let newChannels = trackedUser.channels.replace(`${message.channel.id}|`, '');
                await sqlLib.updateTrackedUser(user, newChannels);
                return message.channel.send(`:white_check_mark: **${user.name}** is not tracked anymore.`);

            } else {
                // Delete the row
                await sqlLib.deleteTrackedUser(user.id);
                return message.channel.send(`:white_check_mark: **${user.name}** is not tracked anymore.`);
            }    
        } else {
            return message.channel.send(`:x: This user is not tracked in this channel.`);
        }
    }
}