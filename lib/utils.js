const fetch = require('node-fetch');
const sqlLib = require('../lib/sqlLib');

class utils {
    static mods = {
		"NF": 1,
		"EZ": 2,
		"HD": 8,
		"HR": 16,
		"SD": 32,
		"DT": 64,
		"HT": 256,
		"NC": 512,
		"FL": 1024,
		"AT": 2048,
		"PF": 16384,
		"V2": 536870912
	};

    static getMods = async (raw_mods) => {
		if(raw_mods === 0)
			return "NM";

		let final = '';

		for (const [k, value] of Object.entries(this.mods)) {
			if((raw_mods & value) > 0) {
				final += k;
			}
		}

		if(final.includes("NC"))
			final = final.replace("DT", "");

		if(final.includes("PF"))
			final = final.replace("SD", "");

		return final;
	}

    static getPp = async (acc, sr, ar, max_combo, mods = 0, miss = 0, player_combo = -1) => {
        let ms = 0;
        // Easy check
        if((mods & (1 << 1)) > 0) 
        ar = ar/2;

        // HR check
        if((mods & (1 << 4)) > 0) {
            ar *= 1.4;
            if(ar >= 10) 
                ar = 10;
        }

        // HT check
        if((mods & (1 << 8)) > 0) {
            if (ar > 5)
                ms = 400 + (11 - ar) * 200;
            else ms = 1600 + (5 - ar) * 160;
            
            if (ms<600)
                ar = 10;
            else if (ms < 1200)
                ar = Math.round((11 - (ms - 300) / 150) * 100) / 100;
            else ar = Math.round((5 - (ms - 1200) / 120) * 100) / 100;
        }

        // DT / NC AR check
        if(((mods & (1 << 6)) > 0) || ((mods & (1 << 9)) > 0)) {
            if (ar > 5)
                ms = 200 + (11 - ar) * 100;
            else ms = 800 + (5 - ar) * 80;
            
            if (ms < 300)
                ar = 11;
            else if (ms < 1200)
                ar = Math.round((11 - (ms - 300) / 150) * 100) / 100;
            else ar = Math.round((5 - (ms - 1200) / 120) * 100) / 100;
        }


        // if player combo not given, calculate for an FC
        if(player_combo === -1)
            player_combo = max_combo;

        // SR -> PP
        let final = Math.pow(((5*(sr)/0.0049)-4),2)/100000;

        // Length bonus
        let lbonus = (0.95 + 0.3 * Math.min(1.0, max_combo / 2500.0) + (max_combo > 2500 ? Math.log10(max_combo / 2500.0) * 0.475 : 0.0));
        final *= lbonus;

        // Miss penality
        final *= Math.pow(0.97, miss);

        // No fc penality
        if(max_combo > 0)
            final *= Math.min(Math.pow(player_combo, 0.8)/Math.pow(max_combo, 0.8), 1);

        // AR Bonus
        let abonus = 1;
        if(ar > 9) 
            abonus += 0.1 * (ar - 9.0);

        if(ar > 10) 
            abonus += 0.1 * (ar - 10.0);

        if(ar < 8) 
            abonus += 0.025 * (8.0 - ar);

        final *= abonus;

        // HD bonus
        if((mods & (1 << 3)) > 0) {
            if(ar > 10)
                final *= 1.01 + 0.04 * (11 - Math.min(11, ar));
            else final *= 1.05 + 0.075 * (10 - ar);
        }

        if((mods & (1 << 10)) > 0) 
            final *= 1.35 * lbonus;

        final *= Math.pow(acc/100, 5.5);

        return Math.round(100*final)/100;
    }

    static getAccuracy = async (c300, c100, c50, miss, drpMiss) => {
		return ((parseInt(c300) + parseInt(c100) + parseInt(c50)) / (parseInt(c300) + parseInt(c100) + parseInt(c50) + parseInt(miss) + parseInt(drpMiss))) * 100
	}

    static getGlobalWeightedPp = async (scores) => {
		let count = 0;
		let totalPp = 0;

		for(let score of scores) {
			let multiplicator = Math.pow(0.95, count);
			totalPp += score.pp * multiplicator;
			count++;
		}

		return totalPp;
	}

    static getGlobalAcc = async (scores) => {
		let count = 0;  
		let totalMulti = 0;
		let totalAcc = 0;

		for (let score of scores) {
			let multiplicator = Math.pow(0.95, count);
			totalMulti += multiplicator;
			totalAcc += (score.accuracy/100) * multiplicator;
			count++;
		}

		return (totalAcc / totalMulti) * 100;
	}

    static secToDhms = async (seconds) => {
        seconds = Number(seconds);
        var d = Math.floor(seconds / (3600*24));
        var h = Math.floor(seconds % (3600*24) / 3600);
        var m = Math.floor(seconds % 3600 / 60);
        var s = Math.floor(seconds % 60);
        
        var dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
        var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
        var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
        var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
        return dDisplay + hDisplay + mDisplay + sDisplay;
    }

    static getRankEmotes = async (rank) => {
        let rankEmote = '';
    
        switch(rank) {
            case 'F':
                rankEmote = '<:rankF:953365746631708783>';
                break;
            case 'D':
                rankEmote = '<:rankD:953364699179794472>';
                break;
            case 'C':
                rankEmote = '<:rankC:953364699485974619>';
                break;
            case 'B':
                rankEmote = '<:rankB:953364699154632784>';
                break;
            case 'A':
                rankEmote = '<:rankA:953364699288862770>';
                break;
            case 'S':
                rankEmote = '<:rankS:953364699171389520>';
                break;
            case 'SH':
                rankEmote = '<:rankSH:953364699188170832>';
                break;
            case 'X':
                rankEmote = '<:rankingX:953364698869420107>';
                break;
            case 'XH':
                rankEmote = '<:rankXH:953364699238498354>';   
                break;         
        }
    
        return rankEmote;
    }

    static getDifficultyEmotesOLD = async (sr) => {
        let emote;
    
        if(sr >= 6.5)
            //Deluge
            emote = '<:diffdeluge:782229298470715443>'
        if(sr >= 5.3 && sr <= 6.49)
            //Overdose
            emote = '<:diffoverdose:782229298667978753>'
        if(sr >= 4.0 && sr <= 5.29)
            //Rain
            emote = '<:diffrain:782229298266243074>'
        if(sr >= 2.7 && sr <= 3.99)
            //Platter
            emote = '<:diffplatter:782229298504269836>'
        if(sr >= 2.0 && sr <= 2.69)
            //Salad
            emote = '<:diffsalad:782229298769166366>'
        if(sr <= 1.99)
            //Cup
            emote = '<:diffcup:782229298609389590>'
        
        return emote;
    }

    static getDifficultyEmotes = async (sr) => {

        sr = Math.round(sr * 100) / 100;

        let emote;

        if(sr >= 8) emote = '<:diff80:953363987330899998>';
        else if(sr >= 7.9) emote = '<:diff79:953334160913739818>';
        else if(sr >= 7.5) emote = '<:diff75:953334161123446908>';
        else if(sr >= 7) emote = '<:diff70:953334161131859968>';
        else if(sr >= 6.5) emote = '<:diff65:953334161039564843>';
        else if(sr >= 6) emote = '<:diff60:953334161295429703>';
        else if(sr >= 5.5) emote = '<:diff55:953334161152823316>';
        else if(sr >= 5) emote = '<:diff50:953334161190567996>';
        else if(sr >= 4.5) emote = '<:diff45:953334161186361354>';
        else if(sr >= 4) emote = '<:diff40:953334161211535370>';
        else if(sr >= 3.5) emote = '<:diff35:953334161144426536>';
        else if(sr >= 3) emote = '<:diff30:953334161115086868>';
        else if(sr >= 2.5) emote = '<:diff25:953334161115070555>';
        else if(sr >= 2) emote = '<:diff20:953334161131835432>';
        else emote = '<:diff15:953334161190584431>';

        return emote;

    }

    static getProfilePictureUrl = async (user_id) => {
        let profilePic = `http://s.ppy.sh/a/${user_id}`;
        const resp = await fetch(profilePic, {method: 'HEAD'});

        if(resp.ok == false) profilePic = 'https://osu.ppy.sh/images/layout/avatar-guest.png';

        return profilePic;
    }

    static fillServerInfoDb = async (beatmap, message) => {
        if(beatmap[0].approvalStatus == 'Ranked' || beatmap[0].approvalStatus == 'Loved' || beatmap[0].approvalStatus == 'Approved') {
            let currentStoredId = await sqlLib.getServerInfo(message.channel.id);
            if(currentStoredId != null) {
                // Update id
                await sqlLib.updateServerInfo(beatmap[0].id, message.guild.id, message.channel.id);
            } else {
                // Insert id
                await sqlLib.addServerInfo(beatmap[0].id, message.guild.id, message.channel.id);
            }
        }
        return true;
    }

}

module.exports = utils;