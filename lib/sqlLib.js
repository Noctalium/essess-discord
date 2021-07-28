class sqlLib {

    static con = require('./mysqlConn');
    static util = require('util');

    static query = this.util.promisify(this.con.query).bind(this.con);

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
}

module.exports = sqlLib;