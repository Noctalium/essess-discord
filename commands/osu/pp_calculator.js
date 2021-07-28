const osuApi = require('../../lib/osuApi');
const sqlLib = require('../../lib/sqlLib');
const utils = require('../../lib/utils');
const Discord = require('discord.js');

const { prefix } = require('../../config.json');
const { getColorFromURL } = require('color-thief-node');

module.exports = {
    name: 'pp_calculator',
    description: '`??pp {beatmap link}` | `??pp {beatmap ID}` - Show pp value of the given beatmap.',
    async execute(message, args){
        if(args.length == 0 || args.length > 1) {
            return message.channel.send(':x: Please enter use `??pp {beatmap link}` or `??pp {beatmap ID}`')
        }
        
        let username = await sqlLib.getLinkedUser(message.author.id);
        if(username == null) {
            return message.channel.send(`:x: Please link your osu! profile first with \`${prefix}osuset (username)\`.`);
        }

        // In case a URL is given
        let link = args[0].split("/");
        let beatmapId = link[link.length - 1];

        if(isNaN(beatmapId)) {
            return message.channel.send(':x: Please enter a valid beatmap URL or a valid beatmap ID.')
        }

        let beatmap = await osuApi.getBeatmaps({b: beatmapId, m: 2, a: 1});
        if(beatmap.length == 0) {
            return message.channel.send(':x: This beatmap do not exist.');
        }

        let embed = await generateEmbed(beatmap[0]);
        return message.channel.send(embed)
            .then(async sentMessage => {
                await sentMessage.react(":HR:782214499163176972") //HR
                await sentMessage.react(":HD:782214499418898432") //HD
                await sentMessage.react(":DT:782214499473424414") //DT
                await sentMessage.react(":EZ:782223187923435520") //EZ
                await sentMessage.react(":HT:782559906602942476") //HT
                await sentMessage.react(":FL:782223187898925087") //FL
                ppReaction(message, sentMessage, beatmapId);
            });
    }
}

async function generateEmbed(beatmap, mods = 0) {
    let beatmapThumbnailUrl = `https://b.ppy.sh/thumb/${beatmap.beatmapSetId}l.jpg`;

    let color = await getColorFromURL(beatmapThumbnailUrl);

    let emote = await utils.getDifficultyEmotes(beatmap.difficulty.rating);

    let umv = getModdedDifficulty(beatmap, mods);

    let warnMsg = '';
    if(mods === 0) warnMsg = 'Please wait for all 6 reactions to pop before changing';

    return new Discord.MessageEmbed()
        .setTitle(`${emote} ${beatmap.artist} - ${beatmap.title} [${beatmap.version}]`)
        .setURL(`https://osu.ppy.sh/beatmapsets/${beatmap.beatmapSetId}#fruits/${beatmap.id}`)
        .setThumbnail(beatmapThumbnailUrl)
        .setColor(color)
        .setDescription(`
        **- Star Rating:**   ${Math.round(beatmap.difficulty.rating*100)/100}★
        **- Approach Rate:** ${Math.round(umv.ar)}
        **- Circle Size:**   ${Math.round(umv.cs*10)/10}
        **- Health Drain:**  ${Math.round(umv.hp*10)/10}
        **- Max Combo:**     ${beatmap.maxCombo}x
    
        **> ${await utils.getMods(parseInt(mods))} - Full Combo
         ${warnMsg}**
        `)
        .addField("100%", `${await utils.getPp(100, beatmap.difficulty.rating, umv.ar, beatmap.maxCombo, mods)}pp`, true)
        .addField("99.5%", `${await utils.getPp(99.5, beatmap.difficulty.rating, umv.ar, beatmap.maxCombo, mods)}pp`, true)
        .addField("99%", `${await utils.getPp(99, beatmap.difficulty.rating, umv.ar, beatmap.maxCombo, mods)}pp`, true)
        .setFooter(`Total playcount: ${beatmap.counts.plays} | ♥ ${beatmap.counts.favourites}`)
}

function ppReaction(message, sentMessage, beatmapId) {
    const modsArray = [
        '782214499163176972',
        '782214499418898432',
        '782214499473424414',
        '782223187969572894',
        '782223187923435520',
        '782559906602942476',
        '782223187898925087'
    ];

    // Delete all reaction after 1 minute
    setTimeout(() => {
        sentMessage.reactions.removeAll();
    }, 60000);

    const filter = (reaction, user) => {
        return message.author.id === user.id && modsArray.includes(reaction.emoji.id);
    }

    const collector = sentMessage.createReactionCollector(filter, { time: 60000, dispose: true});

    let lastReaction;
    let timeout;

    // Refresh message with correct pp w/ mods
    let refresh = (reaction, user) => {
        let now = Date.now()
        if(lastReaction !== 'undefined' && (lastReaction - now) < 1000) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(async () => {
            let beatmap = await osuApi.getBeatmaps({b: beatmapId, m:2, a:1, mods: (getModsFromMsg(sentMessage) & 338)});
            let embed = await generateEmbed(beatmap[0], getModsFromMsg(sentMessage));
            sentMessage.edit(embed);
        }, 1000);
    };

    collector.on('collect', refresh);
    collector.on('remove', refresh);
}

function getModsFromMsg(message) {
    const osuMods = {
        "782223187969572894": 1,
        "782223187923435520": 2,
        "782214499418898432": 8,
        "782214499163176972": 16,
        "782214499473424414": 64,
        "782559906602942476": 256,
        "782223187898925087": 1024,
    };

    let mods = 0;

    for (let r of message.reactions.cache) {
        if(r && r[1] && osuMods[r[1].emoji.id] && r[1].count > 1) {
            mods += osuMods[r[1].emoji.id];
        }
    }

    return mods;
}

function getModdedDifficulty(beatmap, mods) {
    let ar = beatmap.difficulty.approach;
    let cs = beatmap.difficulty.size;
    let hp = beatmap.difficulty.drain;

    let ms = 0;

    // HR check
    if((mods & ( 1<< 4)) > 0) {
        ar *= 1.4;

        if(ar >= 10) {
            ar = 10;
        }

        cs *= 1.3;
        if(cs >= 10) {
            cs = 10;
        }

        hp *= 1.4;
        if(hp >= 10) {
            hp = 10;
        }
    } 

    // EZ check
    if((mods & (1 << 1)) > 0) {
        ar = ar / 2;
        cs = cs / 2;
        hp = hp / 2;
    }

    // HT check
    if((mods & (1 << 8)) > 0) {
        if(ar > 5) {
            ms = 400 + (11 - ar) * 200;
        }
        else {
            ms = 1600 + (5 - ar) * 160;
        }

        if(ms < 600) {
            ar = 10;
        }
        else if(ms < 1200) {
            ar = Math.round((11 - (ms - 300) / 150) * 100) / 100;
        }
        else {
            ar = Math.round((5 - (ms - 1200) / 120) * 100) / 100;
        }
    }

    if(((mods & (1 << 6)) > 0) || ((mods & (1 << 9)) > 0)) {
        if(ar > 5) {
            ms = 200 + (11 - ar) * 100;
        }
        else {
            ms = 800 + (5 - ar) * 80;
        }

        if(ms < 300) {
            ar = 11;
        }
        else if (ms < 1200) {
            ar = Math.round((11 - (ms - 300) / 150) * 100) / 100;
        }
        else {
            ar = Math.round((5 - (ms - 1200) / 120) * 100) / 100;
        }
    }

    return { ar: ar, cs: cs, hp: hp };
}