var mysql = require('mysql')

var pool = mysql.createPool({
	host     : 'localhost',
	user     : 'test',
	password : 'test',
	database : 'test_db'
});


exports.get_connection = function(callback){
	pool.getConnection(callback);
}
