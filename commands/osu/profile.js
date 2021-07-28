const sqlLib = require('../../lib/sqlLib');
const osuApi = require('../../lib/osuApi');
const utils = require('../../lib/utils');
const Discord = require('discord.js');

const fetch = require('node-fetch');

const { prefix } = require('../../config.json');
const { getColorFromURL } = require('color-thief-node');

module.exports = {
    name: 'profile',
    description: '`??profile [username]`, `??p [username]` - Show user\'s ctb profile.',
    async execute(message, args) {
        if(args.length > 1) {
            return message.channel.send(':x: Please only enter 1 username.');
        }

        let username = await sqlLib.getLinkedUser(message.author.id);
        if(username == null) {
            return message.channel.send(`:x: Please link your osu! profile first with \`${prefix}osuset (username)\`.`);
        }

        if(args.length == 1) {
            username = args[0];
        }

        let user = await osuApi.getUser({u: username, m: 2});
        if(user.length == 0) {
            return message.channel.send(':x: This user do not exist.');
        }

        let embed = await generateEmbed(user)
        return message.channel.send(embed);

    }
}

async function generateEmbed(user) {
    let profilePic = `http://s.ppy.sh/a/${user.id}`;

    const resp = await fetch(profilePic, {
        method: 'HEAD'
    });

    if(resp.ok == false) profilePic = 'https://osu.ppy.sh/images/layout/avatar-guest.png';

    let color = await getColorFromURL(profilePic);

    let embed = new Discord.MessageEmbed()
    .setTitle(`:flag_${user.country.toLowerCase()}: osu!ctb profile for ${user.name}`)
    .setThumbnail(profilePic)
    .setColor(color)
    .setDescription(`
    **- Rank:** #${user.pp.rank} (${user.country}#${user.pp.countryRank})
    **- Raw PP:** ${user.pp.raw}
    **- Accuracy:** ${Math.round(user.accuracy*10000) / 10000}%
    **- Playcount:** ${user.counts.plays}

    **${await utils.getRankEmotes('XH')} ${user.counts.SSH} | ${await utils.getRankEmotes('X')} ${user.counts.SS} | ${await utils.getRankEmotes('SH')} ${user.counts.SH} | ${await utils.getRankEmotes('S')} ${user.counts.S}**

    **Lv${Math.round(user.level*100) / 100}**
    `)
    .setFooter(`Total playtime : ${await utils.secToDhms(user.secondsPlayed)}`)
    .setURL(`https://osu.ppy.sh/users/${user.id}`)

    return embed;
}