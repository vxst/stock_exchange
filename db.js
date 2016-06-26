var mysql = require('mysql')

var pool = mysql.createPool({
	host     : 'localhost',
	user     : 'stock_exchange',
	password : 'xvAmM5r75yUEqdYT',
	database : 'stock_exchange'
});


exports.get_connection = function(callback){
	pool.getConnection(callback);
}
