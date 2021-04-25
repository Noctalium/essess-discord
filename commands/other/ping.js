module.exports = {
    name: 'ping',
    description: 'Test command',
    execute(message) {
        message.channel.send('Pong!');
    }
};