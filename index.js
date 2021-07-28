const Discord = require('discord.js');
const client = new Discord.Client();

const fs = require('fs');
const mysql = require('mysql');
const cron = require('node-cron');

const { prefix, apiurl, osuApiToken, token, ownerId, dbhost, dbuser, dbpass, dbase } = require('./config.json');
const con = require('./lib/mysqlConn');

client.commands = new Discord.Collection();

const commands = {
    osuCommands: [
        fs.readdirSync('./commands/osu').filter(file => file.endsWith('.js')),
        './commands/osu/'
    ],
    otherCommands: [
        fs.readdirSync('./commands/other').filter(file => file.endsWith('.js')),
        './commands/other/'
    ],
    cronCommands: [
        fs.readdirSync('./commands/cron').filter(file => file.endsWith('.js')),
        '/commands/cron/'
    ]
};

for(const [k, val] of Object.entries(commands)) {
    for(let file of val[0]) {
            let command = require(val[1] + file);
            client.commands.set(command.name, command);
        }
}
    
client.once('ready', () => {
    console.log('Ready');
});

client.on('message', message => {

    if(!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // Commands
    if(command === 'ping') client.commands.get('ping').execute(message);
    if(command === 'roll') client.commands.get('roll').execute(message, args);

    if(command === 'osuset') client.commands.get('osuset').execute(message, args);
    if(command === 'profile' || command === 'p') client.commands.get('profile').execute(message, args);
    if(command === 'recent' || command === 'rs') client.commands.get('recent').execute(message, args);
    if(command === '1miss') client.commands.get('1miss').execute(message, args);
    if(command === 'pp') client.commands.get('pp_calculator').execute(message, args);
    if(command === 'misscount' || command === 'mc') client.commands.get('misscount').execute(message, args);
    if(command === 'accuracy' || command === 'acc') client.commands.get('accuracy').execute(message, args);
    if(command === 'compare' || command === 'c') client.commands.get('compare').execute(message, args);
    if(command === 'score' || command === 's' || command === 'sc') client.commands.get('score').execute(message, args);
    if(command === 'topplay' || command === 'top' || command === 'ctbtop') client.commands.get('topplay').execute(message, args);
    
    /* TO FIX
    if(command === 'simulator' || command === 'sm') client.commands.get('simulator').execute(message, args);
    */
});

client.login(token);