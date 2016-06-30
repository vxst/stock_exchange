"use strict";

var database = require("./db");
var async = require("async");

exports.search_stock = function(request, response){
	var keyword = "%"+request.query.keyword+"%";
	async.waterfall([
		function(callback){
			database.get_connection(callback);
		},
		function(connection, callback){
			connection.query("SELECT id, name FROM stock WHERE name LIKE ? OR id LIKE ?", [keyword, keyword],
				function(error, results){
					connection.release();
					if(error){
						response.fail();
					}else{
						response.ok_with_data(results);
					}
					callback(null);
				});
		}
	]);
}

exports.stock_info = function(request, response){
	var stock_id = request.query.stock_id;
	async.waterfall([
		function(callback){
			database.get_connection(callback);
		},
		function(connection, callback){
			connection.query("SELECT id, name, base_price, max_change, active FROM stock WHERE id = ?", [stock_id],
				function(error, results){
					if(error || results.length != 1){
						console.log(error);
						connection.release();
						response.fail();
						callback("Failed");
					}else{
						callback(null, connection, results[0]);
					}
				});
		},
		function(connection, base_info, callback){
			connection.query(
				`(SELECT direction, amount, price FROM active_orders WHERE stock_id = ? AND direction = FALSE ORDER BY price ASC LIMIT 6)
				UNION ALL
				 (SELECT direction, amount, price FROM active_orders WHERE stock_id = ? AND direction = TRUE ORDER BY price DESC LIMIT 6)
				 ORDER BY price DESC`,
				 [stock_id, stock_id],
				 function(error, results){
					 connection.release();
					 if(error){
					 	console.log(error);
						 response.fail();
						 callback("Failed");
					 }else{
						 base_info.depth = results;
						 response.ok_with_data(base_info);
						 callback(null);
					 }
				 });
		}
	]);
}

exports.stock_history = function(request, response){
	var stock_id = request.query.stock_id;
	async.waterfall([
		function(callback){
			database.get_connection(callback);
		},
		function(connection, callback){
			connection.query("SELECT complete_time AS time, price FROM history_orders WHERE stock_id = ? ORDER BY complete_time ASC",
				[stock_id],
				function(error, results){
					connection.release();
					if(error){
						response.fail();
					}else{
						response.ok_with_data(results);
					}
					callback(null);
				});
		}
	]);
}
