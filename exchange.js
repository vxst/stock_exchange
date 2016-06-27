"use strict";

var database = require("./db");
var async = require("async");

exports.get_orders = function(request, response){
	var user_id = request.session.user_id;

	if(user_id === undefined){
		response.fail();
		return;
	}

	async.waterfall(
	[
		function(callback){
			database.get_connection(callback);
		},
		function(connection, callback){
			connection.query("SELECT id, stock_id, stock.name as stock_name, direction, price, amount FROM active_orders JOIN stock ON active_orders.stock_id = stock.id WHERE active_orders.user_id = ?", [user_id], function(error, result){
				connection.release();
				if(error != null)
					response.fail();
				else{
					response.ok_with_data(result);
				}
				callback(null);
			});
		}
	]);
}

exports.get_stocks = function(request, response){
	var user_id = request.session.user_id;
	if(user_id === undefined){
		response.fail();
		return;
	}
	async.waterfall(
	[
		function(callback){
			database.get_connection(callback);
		},
		function(connection, callback){
			connection.query("SELECT stock_id, stock.name AS stock_name, amount FROM stock_holding JOIN stock ON stock.id = stock_id WHERE user_id = ?", [user_id], 
				function(error, result){
					connection.release();
					if(error)
						response.fail();
					else
						response.ok_with_data(result);
					callback(null);
				}
			);
		}
	]);
}

exports.new_order = function(request, response){
	var user_id = request.session.user_id;
	var stock_id = request.body.stock_id;
	var direction = request.body.direction;
	var buy_in_order = direction === true;
	var sell_out_order = direction === false;
	var price = request.body.price;
	var amount = request.body.amount;

	var money = price * amount;

	if(user_id === undefined){
		response.fail();
		return;
	}

	if(buy_in_order == sell_out_order){
		response.assert();
		return;
	}

	async.waterfall(
	[
		function(callback){
			database.get_connection(callback);
		},
		function(connection, callback){
			connection.query("SELECT base_price, max_change FROM stock WHERE id = ? AND active = TRUE", [stock_id],
				function(error, result){
					if(error || result.length != 1){
						connection.release();
						callback("No such active stock");
						return;
					}
					var max_price = result[0].base_price * (1.0+max_change);
					var min_price = result[0].base_price * (1.0-max_change);
					if(price > max_price || price < min_price){
						connection.release();
						callback("Price over range");
						return;
					}
					callback(null, connection);
				});
		},
		function(connection, callback){
			if(buy_in_order)
				connection.query("SELECT money FROM user_money WHERE stock_account_id = ?", [user_id], function(error, result){
					if(result.length < 1 || result[0].money < money){
						connection.release();
						callback("Not enough money");
					}else{
						callback(null, connection, result[0].money);
					}
				});
			if(sell_out_order)
				connection.query("SELECT amount FROM stock_holding WHERE user_id = ? AND stock_id = ?", [user_id, stock_id], function(error, result){
					if(result.length < 1 || result[0].amount < amount){
						connection.release();
						callback("Not enough stock");
					}else{
						callback(null, connection, result[0].amount);
					}
				});
		},
		function(connection, data, callback){
			if(buy_in_order){
				connection.query("UPDATE user_money SET money = ? WHERE stock_account_id = ?", [data - money, user_id], function(error, result){
					if(error || result.affectedRows != 1){
						response.assert();
						return;
					}
					callback(null, connection);
				});
			}
			if(sell_out_order){
				connection.query("UPDATE stock_holding SET amount = ? WHERE user_id = ?", [data - amount, user_id], function(error, result){
					if(error || result.affectedRows != 1){
						response.assert();
						return;
					}
					callback(null, connection);
				});
			}
		},
		function(connection, callback){
			connection.query("INSERT INTO active_orders (user_id, stock_id, direction, price, amount) VALUES(?, ?, ?, ?, ?)", [user_id, stock_id, direction, price, amount], function(error, result){
				connection.release();
				if(error || result.affectedRows != 1){
					response.assert();
					return;
				}
				response.ok();
				callback(null);
			}
			);
		}
	],
	function(error){
		if(error)
			response.fail_with_message(error);
	}
	);
}

exports.remove_order = function(request, response){
	var user_id = request.session.user_id;
	var order_id = request.body.order_id;

	if(user_id === undefined){
		response.fail();
		return;
	}

	async.waterfall(
	[
		function(callback){
			database.get_connection(callback);
		},
		function(connection, callback){
			connection.query("SELECT stock_id, price, amount, direction FROM active_orders WHERE user_id = ? AND id = ?", [user_id, order_id], function(error, result){
				if(result.length < 1){
					connection.release();
					callback("No such order");
					return;
				}
				callback(error, connection, result[0].stock_id, result[0].price, result[0].amount, result[0].direction);
			});
		},
		function(connection, stock_id, price, amount, direction){
			var buy_in_order = direction === true;
			var sell_out_order = direction === false;
			if(buy_in_order == sell_out_order){
				response.assert();
				return;
			}
			if(buy_in_order){
				connection.query("SELECT money FROM user_money WHERE stock_account_id = ?", user_id, function(error, result){
					if(error || result.length < 1){
						connection.release();
						callback("No money account?");
						return;
					}
					callback(error, connection, stock_id, price, amount, direction, result[0].money);
				});
			}
			if(sell_out_order){
				connection.query("SELECT amount FROM stock_holding WHERE user_id = ? AND stock_id = ?", [user_id, stock_id], function(error, result){
					if(error || result.length < 1){
						connection.release();
						callback("No such stock holding?");
						return;
					}
					callback(error, connection, stock_id, price, amount, direction, result[0].amount);
				});
			}
		},
		function(connection, stock_id, price, amount, direction, data){
			var buy_in_order = direction === true;
			var sell_out_order = direction === false;
			if(buy_in_order == sell_out_order){
				response.assert();
				return;
			}
			if(buy_in_order){
				connection.query("UPDATE user_money SET money = ? WHERE stock_account_id = ?", [data + amount * price], function(error, result){
					if(error || result.affectedRows < 1){
						response.assert();
						return;
					}
					callback(null, connection);
				});
			}
			if(sell_out_order){
				connection.query("UPDATE stock_holding SET amount = ? WHERE user_id = ?", [data + amount, user_id], function(error, result){
					if(error || result.affectedRows < 1){
						response.assert();
						return;
					}
					callback(null, connection);
				});
			}
		},
		function(connection, callback){
			connection.query("DELETE FROM active_orders WHERE id = ? AND user_id = ?", [order_id, user_id], function(error, result){
				connection.release();
				if(error || result.affectedRows < 1){
					response.assert();
					return;
				}
				response.ok();
			});
		}
	]);
}
