var mysql = require('mysql')

var pool = mysql.createPool({
	host     : 'localhost',
	user     : 'test',
	password : 'test',
	database : 'test_db'
});

exports.initDB = function(){
	pool.getConnection(
		function(err, connection){
			connection.query("CREATE TABLE IF NOT EXISTS users(id INT PRIMARY KEY AUTO_INCREMENT, username VARCHAR(32), name VARCHAR(32), password CHAR(20), date TIMESTAMP, national_id VARCHAR(32), address VARCHAR(255), work VARCHAR(32), education VARCHAR(32), work_phone VARCHAR(32), is_admin BOOLEAN)");
			connection.query("CREATE TABLE IF NOT EXISTS users_money(id INT PRIMARY KEY AUTO_INCREMENT, users_stock_id INT, password CHAR(20), money DOUBLE)");
			connection.query("CREATE TABLE IF NOT EXISTS admin(id INT PRIMARY KEY, username VARCHAR(64), password CHAR(20))");
			connection.query("CREATE TABLE IF NOT EXISTS stock(id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(32), current_price DOUBLE)");
			connection.query("CREATE TABLE IF NOT EXISTS active_orders(id INT PRIMARY KEY AUTO_INCREMENT, users_id INT, stock_id INT, direction BOOLEAN, price DOUBLE, amount INT)");
			connection.query("CREATE TABLE IF NOT EXISTS history_orders(id INT PRIMARY KEY AUTO_INCREMENT, stock_id INT, sell_user_id INT, buy_user_id INT, price DOUBLE, amount INT)");
			connection.release();
		}
	);
}

exports.getConnection = function(callback){
	pool.getConnection(callback);
}
