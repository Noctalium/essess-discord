const sqlLib = require('../../lib/sqlLib');
const osuApi = require('../../lib/osuApi');

const { prefix } = require('../../config.json');

module.exports = {
    name: 'tracking_migration',
    description: '',
    async execute(message, args) {

        message.channel.send("Database migration start");
        let oldTrackedUsers = await sqlLib.getAllOldTrackedUsers();
        console.log("Number of old tracked users: " + oldTrackedUsers.length);

       for(i = 0; i < oldTrackedUsers.length; i++) {
           console.log('---------- new row');
           let oldUser = oldTrackedUsers[i];

           let user = await osuApi.getUser({u: oldUser.user_id, m: 2});
           if(user.length == 0) {
                message.channel.send(`:x: User ${oldUser.user_id} do not exist.`);
           }

            if(user.pp.raw < 3000) {
                message.channel.send(`:x: ${user.name} do not have enough pp (${user.pp.raw})`);
            } else {
                let trackedUser = await sqlLib.getTrackedUser(user.id);

                if(trackedUser) {

                // Check if user is already tracked in the given channel
                let channelsArray = trackedUser.channels.split('|');

                if(!channelsArray.includes(oldUser.channel_id)) {
                    // Update after adding the channel id to the string
                    let newChannels = `${trackedUser.channels}${oldUser.channel_id}|`;
                    await sqlLib.updateTrackedUser(user, newChannels);
                    message.channel.send(`:white_check_mark: **${user.name}** is now tracked here.`);

                } else {
                    message.channel.send(`:x: This user is already tracked in the channel, use \`${prefix}untrack ${user.name}\` to remove it.`);
                }

                } else {
                    // INSERT
                    let channels = oldUser.channel_id + '|';
                    await sqlLib.addTrackedUser(user, channels);
                    message.channel.send(`:white_check_mark: **${user.name}** is now tracked here.`);
                }
            }

            
       }
    }
}