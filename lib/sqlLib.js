const osuApi = require('../lib/osuApi');

class sqlLib {

    static con = require('./mysqlConn');
    static util = require('util');

    static query = this.util.promisify(this.con.query).bind(this.con);

    /* -- USER TABLE -- */
    static getLinkedUser = async (discord_id) => {
        let sql = `SELECT osu_id FROM users WHERE discord_id = ?`;
        let result = await this.query(sql, [discord_id]);

        if(result.length == 0) return null;
        return result[0].osu_id;
    }

    static linkUser = async (discord_id, osu_id) => {
        let sql = `INSERT INTO users (discord_id, osu_id, register_date, last_update) VALUES (?, ?, CURRENT_DATE, CURRENT_DATE)`;
        let val = [discord_id, osu_id];

        this.query(sql, val, (err, res, field) => {
            if(err) throw err;
        });

        return true;
    }

    static updateLinkedUser = async (discord_id, osu_id) => {
        let sql = `UPDATE users SET osu_id = ?, last_updated = CURRENT_DATE WHERE discord_id = ?`;
        let val = [osu_id, discord_id];

        this.query(sql, val, (err, res, field) => {
            if(err) throw err;
        });
        
        return true;
    }

    /* -- SERVERINFO TABLE -- */
    static getServerInfo = async (channel_id) => {
        let sql = `SELECT last_beatmap_id FROM server_info WHERE channel_id = ?`;
        let result = await this.query(sql, [channel_id]);

        if(result.length == 0) return null;
        return result[0].last_beatmap_id;
    }

    static addServerInfo = async (beatmap_id, server_id, channel_id) => {
        let sql = `INSERT INTO server_info (server_id, channel_id, last_beatmap_id) VALUES (?, ?, ?)`;
        let val = [server_id, channel_id, beatmap_id];

        this.query(sql, val, (err, res, field) => {
            if(err) throw err;
        });

        return true;
    }

    static updateServerInfo = async (beatmap_id, server_id, channel_id) => {
        let sql = `UPDATE server_info SET last_beatmap_id = ? WHERE server_id = ? AND channel_id = ?`;
        let val = [beatmap_id, server_id, channel_id];

        this.query(sql, val, (err, res, field) => {
            if(err) throw err;
        });

        return true;
    }

    /* -- MAPFEED TABLE -- */
    static getAllMapfeedChannels = async () => {
        let sql = `SELECT channel_id FROM ranked_tracking`;
        let result = await this.query(sql);

        if(result.length == 0) return null;
        return result;
    }

    static getMapfeedChannel = async (channel_id) => {
        let sql = `SELECT id FROM ranked_tracking WHERE channel_id =  ?`;
        let result = await this.query(sql, [channel_id]);

        if(result.length == 0) return null;
        return result[0].id;
    }

    static addMapfeedChannel = async (channel_id) => {
        let sql = `INSERT INTO ranked_tracking (channel_id) VALUES (?)`;
        let val = [channel_id];

        this.query(sql, val, (err, res, field) => {
            if(err) throw err;
        });

        return true;
    }

    static deleteMapfeedChannel = async (channel_id) => {
        let sql = `DELETE FROM ranked_tracking WHERE channel_id = ?`;
        let val = [channel_id];

        this.query(sql, val, (err, res, field) => {
            if(err) throw err;
        });

        return true;
    }

    /* -- PP TRACKING TABLE -- */
    // channel_id|channel_id|channel_id|

    static getAllTrackedUsers = async () => {
        let sql = `SELECT id, user_id, channels, current_pp, current_acc, current_rank, current_crank, last_check FROM pp_tracking`;
        let result = await this.query(sql);

        if(result.length == 0) return null;
        return result;
    } 

    static getTrackedUser = async (user_id) => {
        let sql = `SELECT id, user_id, channels, current_pp, current_acc, current_rank, current_crank, last_check FROM pp_tracking WHERE user_id = ?`;
        let result = await this.query(sql, [user_id]);

        if(result.length == 0) return null;
        return result[0];
    }

    static addTrackedUser = async (user, channels) => {
        let sql = `INSERT INTO pp_tracking (user_id, channels, current_pp, current_acc, current_rank, current_crank, last_check) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`;
        let val = [user.id, channels, user.pp.raw, user.accuracy, user.pp.rank, user.pp.countryRank];

        this.query(sql, val, (err, res, field) => {
            if(err) throw err;
        });

        return true;
    }

    static updateTrackedUser = async (user, channels, updateTime = 1) => {
        let sql = `UPDATE pp_tracking SET channels = ?, current_pp = ?, current_acc = ?, current_rank = ?, current_crank = ?`;

        if(updateTime == 1) sql = `${sql}, last_check = CURRENT_TIMESTAMP`;

        sql = `${sql} WHERE user_id = ?`;

        let val = [channels, user.pp.raw, user.accuracy, user.pp.rank, user.pp.countryRank, user.id];

        this.query(sql, val, (err, res, field) => {
            if(err) throw err;
        });

        return true;
    }

    static deleteTrackedUser = async (user_id) => {
        let sql = `DELETE FROM pp_tracking WHERE user_id = ?`;
        let val = [user_id];

        this.query(sql, val, (err, res, field) => {
            if(err) throw err;
        });

        return true;
    }
    
    /* -- FAILED SCORE TABLE -- */
    static getFailedScore = async (user_id, beatmap_id) => {
        let sql = `SELECT id, user_id, beatmap_id, mods, play_rank, pp_value, accuracy, score, player_combo, miss, dropmiss, play_date FROM failed_scores WHERE user_id = ? AND beatmap_id = ?`;
        let result = await this.query(sql, [user_id, beatmap_id]);

        if(result.length == 0) return null;
        return result[0];
    }

    static addFailedScore = async (score) => {
        return 0;
    }

    /* -- BOT VAR -- */
    static getLastMapfeedTime = async () => {
        let sql = `SELECT mapfeed_lastcheck FROM bot_var`;
        let result = await this.query(sql);

        if(result.length == 0) return null;
        return result[0].mapfeed_lastcheck;
    }

    static updateMapfeedTime = async () => {
        let sql = `UPDATE bot_var SET mapfeed_lastcheck = CURRENT_TIMESTAMP`;
        this.query(sql);
        
        return true;
    }

    /* -- MIGRATION -- */
    static getAllOldTrackedUsers = async () => {
        let sql = `SELECT * FROM user_tracking`;
        let result = await this.query(sql);

        if(result.length == 0) return null;
        return result;
    }

    static getTmpRow = async () => {
        let sql = `SELECT * FROM u_tmp`;
        let result = await this.query(sql);

        if(result.length == 0) return null;
        return result;
    }

    static setTmpRow = async () => {
        let sql = `UPDATE u_tmp SET tmp12 = 'a' WHERE id = 1`;
        this.query(sql);

        return true;
    }
}

module.exports = sqlLib;