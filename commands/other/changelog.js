const Discord = require('discord.js');

const { prefix } = require('../../config.json');
const { getColorFromURL } = require('color-thief-node');

module.exports = {
    name: 'changelog',
    description: `\`${prefix}changelog\` - Show Essess's changelog.`,
    async execute(message, args) {
        let color = await getColorFromURL('https://cdn.discordapp.com/attachments/383631230685544471/817324506019659776/diff-overdose.png');
        let content = `
        **v2.1.0 Changelog:**

        **+** \`${prefix}unlink\` command, to unlink and remove your data from Essess database

        **v2.0.1 - 2.0.2 Changelog:**

        **▸** Fixed wrong beatmap URLs with the \`${prefix}acc\` command

        **▸** Fixed wrong AR with the \`${prefix}pp\` command

        **▸** Fixed the \`${prefix}osuset\` command, it works fine now

        `;

        let embed = new Discord.MessageEmbed()
        .setAuthor(
            `Essess Changelog`,
            `https://cdn.discordapp.com/attachments/383631230685544471/817324506019659776/diff-overdose.png`,
            ``
        )
        .setDescription(content)
        .setColor(color)
        .setFooter(`Made by Noctalium#1621`);

        return message.channel.send(embed);
    }
};

/*
**v1.4.0 Changelog:**

        **+** Added the \`??top [username]\` command: Display the top 5 pp plays of user.

        **+** Added the \`??mapfeed\` command: Track newly ranked beatmap and send a message every time a new one is ranked.

        ----------

**v1.5.0 Changelog:**

        **+** Added the \`??changelog\` command: Display the most recent change to the bot.

        **+** Added the \`??lbinfo\` command: Display information about the unranked leaderboard feature.

        **->** Modified the \`??help\` command to make it better.

        ---------

**v2.0.0 Changelog:**

        **▸** Fixed bugs with the player command (\`${prefix}track (username)\`) where some tracks didn't ever worked

        **▸** User with no profile picture can now use the bot

        **▸** Fixed bug where, sometimes, randomly, commands didn't worked at all (blame peppy on this one)

        **▸** Added new difficulty colors

        **▸** Optimized the code, to prepare something else big (soontm) 👀

        **->** To avoid useless spam, the \`${prefix}track (username)\` command do not allow players with less than **3000pp** to be tracked
*/