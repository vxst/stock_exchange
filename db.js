"use strict";

var mysql = require('mysql')

var pool = mysql.createPool({
	host     : 'localhost',
	user     : 'stock_exchange',
	password : 'xvAmM5r75yUEqdYT',
	database : 'stock_exchange',
	charset  : 'utf8_bin',
	connectionLimit: 32
});


exports.get_connection = function(callback){
	pool.getConnection(function(error, connection){
		if(error)
			callback(error);
		else
			connection.query("SET NAMES 'utf8'", function(error, result){
				callback(error, connection);
			});
	});
}
