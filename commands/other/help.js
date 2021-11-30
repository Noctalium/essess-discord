const Discord = require('discord.js');

const { prefix } = require('../../config.json');
const { getColorFromURL } = require('color-thief-node');

module.exports = {
    name: 'help',
    description: 'help',
    async execute(message, args, commands) {

        const hideCmd = ['mapfeed_msg', 'pp_tracking_msg', 'simulator', 'help',
        'joke_bison_charge', 'joke_coolest', 'joke_finorza', 'joke_image_material',
        'tracking_migration', 'ping', 'recent_o'];

        let embed = await generateDefaultEmbed(hideCmd, commands);
        return message.channel.send(embed);
    }
}

async function generateDefaultEmbed(hideCmd, commandsList) {
    let description = ``;
    commandsList.forEach(command => {
        if(!hideCmd.includes(command.name)) {
            description += command.description + `

            `;
        }
    });
    return new Discord.MessageEmbed()
    .setAuthor(
        `Command list:`,
        `https://cdn.discordapp.com/attachments/383631230685544471/817324506019659776/diff-overdose.png`,
        ``
    )
    .setDescription(description)
    .setColor(await getColorFromURL('https://cdn.discordapp.com/attachments/383631230685544471/817324506019659776/diff-overdose.png'))
    .setFooter(`{} -> Required | [] -> Optional -- If username is not given, command's author will be the default choice.
    If you have more question, feel free to DM Noctalium#1621`);
}