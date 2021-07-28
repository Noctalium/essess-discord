const { dbhost, dbuser, dbpass, dbase } = require('../config.json');


var mysql = require('mysql');
var conn = mysql.createConnection({
  host: dbhost,
  user: dbuser,
  password: dbpass,
  database: dbase
}); 

conn.connect(function(err) {
  if (err) throw err;
  console.log('Database is connected successfully !');
});

module.exports = conn;