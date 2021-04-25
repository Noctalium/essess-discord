const { dbhost, dbuser, dbpass, dbase } = require('../config.json');


var mysql = require('mysql');
var conn = mysql.createConnection({
  host: dbhost, // Replace with your host name
  user: dbuser,      // Replace with your database username
  password: dbpass,      // Replace with your database password
  database: dbase // // Replace with your database Name
}); 

conn.connect(function(err) {
  if (err) throw err;
  console.log('Database is connected successfully !');
});

module.exports = conn;