const sqlLib = require('../../lib/sqlLib');
const osuApi = require('../../lib/osuApi');

const { prefix } = require('../../config.json');

module.exports = {
    name: 'unset',
    description: `\`${prefix}unset\` - Unlink your account`,
    async execute(message, args) {

        let user = await sqlLib.getLinkedUser(message.author.id);
        
        if(user == null) {
            return message.channel.send(`:x: You are not linked yet`);
        }
        else {
            let rm = await sqlLib.unlinkUser(message.author.id);
            if(rm) return message.channel.send(`:white_check_mark: Account unlinked`);
        }
    }
}