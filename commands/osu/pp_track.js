const sqlLib = require('../../lib/sqlLib');
const osuApi = require('../../lib/osuApi');

const { prefix } = require('../../config.json');

module.exports = {
    name: 'pp_track',
    description: `\`${prefix}track {username}\` - (Server admin only) Track user's new top pp plays in the channel.`,
    async execute(message, args) {
        if(!message.member.hasPermission('ADMINISTRATOR')) {
            return message.channel.send(':x: You don\'t have the permissions to do this.')
        }

        if(args.length == 0 || args.length > 1) {
            return message.channel.send(`:x: Please use \`${prefix}track (username)\`.`);
        }

        let user = await osuApi.getUser({u: args[0], m: 2});
        if(user.length == 0) {
            return message.channel.send(':x: This user do not exist.');
        }
        if(user.pp.raw < 3000) {
            return message.channel.send(':x: To avoid spam, an user must have at least **3000pp** to be tracked.');
        }

        let trackedUser = await sqlLib.getTrackedUser(user.id);
        
        if(trackedUser) {

            // Check if user is already tracked in the given channel
            let channelsArray = trackedUser.channels.split('|');

            if(!channelsArray.includes(message.channel.id)) {
                // Update after adding the channel id to the string
                let newChannels = `${trackedUser.channels}${message.channel.id}|`;
                await sqlLib.updateTrackedUser(user, newChannels);
                return message.channel.send(`:white_check_mark: **${user.name}** is now tracked here.`);

            } else {
                return message.channel.send(`:x: This user is already tracked in this channel, use \`${prefix}untrack ${user.name}\` to remove it.`);
            }

        } else {
            // INSERT
            let channels = message.channel.id + '|';
            await sqlLib.addTrackedUser(user, channels);
            return message.channel.send(`:white_check_mark: **${user.name}** is now tracked here.`);
        }
    }
}