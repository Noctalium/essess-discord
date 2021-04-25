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
}

module.exports = sqlLib;