var mysql = require('mysql')

var pool = mysql.createPool({
	host     : 'localhost',
	user     : 'test',
	password : 'test',
	database : 'test_db'
});

exports.init_database = function(){
	pool.getConnection(
		function(err, connection){
			async.series([
				function(callback){
					connection.query("CREATE TABLE IF NOT EXISTS users(id INT PRIMARY KEY AUTO_INCREMENT, username VARCHAR(32), name VARCHAR(32), password CHAR(20), create_time TIMESTAMP, national_id VARCHAR(32), address VARCHAR(255), work VARCHAR(32), education VARCHAR(32), work_phone VARCHAR(32), is_admin BOOLEAN)", callback);
				},
				function(callback){
					connection.query("CREATE TABLE IF NOT EXISTS users_money(id INT PRIMARY KEY AUTO_INCREMENT, stock_account_id INT, password CHAR(20), money DOUBLE)", callback);
				},
				function(callback){
					connection.query("CREATE TABLE IF NOT EXISTS stock(id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(32), base_price DOUBLE, max_change DOUBLE, next_max_change DOUBLE, active BOOLEAN)", callback);
				},
				function(callback){
					connection.query("CREATE TABLE IF NOT EXISTS active_orders(id INT PRIMARY KEY AUTO_INCREMENT, user_id INT, stock_id INT, direction BOOLEAN, price DOUBLE, amount INT)", callback);
				},
				function(callback){
					connection.query("CREATE TABLE IF NOT EXISTS history_orders(id INT PRIMARY KEY AUTO_INCREMENT, stock_id INT, sell_user_id INT, buy_user_id INT, price DOUBLE, amount INT, complete_time TIMESTAMP)", callback);
				},
				function(callback){
					connection.query("CREATE TABLE IF NOT EXISTS stock_holding(id INT PRIMARY KEY AUTO_INCREMENT, user_id INT, stock_id INT, amount INT)", callback);
				},
				function(callback){
					connection.release();
					callback(null);
				}
			]);
		}
	);
}

exports.get_connection = function(callback){
	pool.getConnection(callback);
}
