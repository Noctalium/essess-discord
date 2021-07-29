const { prefix } = require('../../config.json');

module.exports = {
    name: 'roll',
    description: `\`${prefix}roll [number]\` - Roll a random number between 0 and the given number (default is 100).`,
    execute(message, args) {
        let maxValue = 100;

        if(args.length > 0) {
            if(!isNaN(args[0])) {
                maxValue = parseInt(args[0]);
            }
        }
        let roll = Math.floor(Math.random() * (maxValue + 1));
        return message.channel.send(`${message.author} rolled **${roll}** !`);
    }
};