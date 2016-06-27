"use strict";

var database = require("./db");
var async = require("async");

exports.add_stock = function(request, response){
	if(request.session.is_admin !== true){
		response.fail();
		return;
	}
	var stock_name = request.body.stock_name;
	var base_price = request.body.base_price;
	var max_change = request.body.max_change;

	async.waterfall([
		function(callback){
			database.get_connection(callback);
		},
		function(connection, callback){
			connection.query("INSERT INTO stock (name, base_price, max_change) VALUES(?, ?, ?)",
				[stock_name, base_price, max_change],
				function(error, result){
					connection.release();
					if(error || result.affectedRows != 1){
						response.fail();
					}else{
						response.ok();
					}
					callback(null);
				});
		}
	]);
}

exports.edit_stock = function(request, response){
	if(request.session.is_admin !== true){
		response.fail();
		return;
	}
	var stock_id = request.body.stock_id;
	var max_change = request.body.max_change;

	async.waterfall([
		function(callback){
			database.get_connection(callback);
		},
		function(connection, callback){
			connection.query("UPDATE stock SET next_max_change=? WHERE id=?", [max_change, stock_id],
				function(error, result){
					connection.release();
					if(error || result.affectedRows != 1){
						response.fail();
					}else{
						response.ok();
					}
					callback(null);
				});
		}
	]);
}

exports.turn_stock = function(request, response){
	if(request.session.is_admin !== true){
		response.fail();
		return;
	}
	var stock_id = request.body.stock_id;
	var active = request.body.active;

	async.waterfall([
		function(callback){
			database.get_connection(callback);
		},
		function(connection, callback){
			connection.query("UPDATE stock SET active = ? WHERE id = ?", [active, stock_id],
				function(error, result){
					connection.release();
					if(error || result.affectedRows != 1){
						response.fail();
					}else{
						response.ok();
					}
					callback(null);
				});
		}
	]);
}
