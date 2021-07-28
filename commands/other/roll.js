module.exports = {
    name: 'roll',
    description: 'roll command',
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