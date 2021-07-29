const sqlLib = require('../../lib/sqlLib');
const { prefix } = require('../../config.json');

module.exports = {
    name: 'mapfeed',
    description: '`??mapfeed` - Send a message on the channel every time a new ctb beatmap get ranked. Use the command again to remove the mapfeed.',
    async execute(message, args) {
        if(!message.member.hasPermission('ADMINISTRATOR')) {
            return message.channel.send(':x: You don\'t have the permissions to do this.')
        }

        if(await sqlLib.getMapfeedChannel(message.channel.id)) {
            // Command used again, we delete
            await sqlLib.deleteMapfeedChannel(message.channel.id);
            return message.channel.send(":white_check_mark: New ranked maps won't be tracked here anymore :/");
        }
        else {
            await sqlLib.addMapfeedChannel(message.channel.id);
            return message.channel.send(":white_check_mark: New ranked maps will be tracked in this channel.");
        }
    }
}