const { osuApiToken } = require('../config.json');

var osu = require('node-osu');
var osuApi = new osu.Api(osuApiToken, {
    notFoundAsError: false,
	completeScores: false,
	parseNumeric: false
});

module.exports = osuApi;