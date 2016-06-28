"use strict";

var database = require("./db");
var async = require("async");
var counter = 1

function user_money_add(connection, user_id, money, callback){
	if(Math.abs(money) < 0.01){
		callback(null);
		return;
	}
	connection.query(
		"UPDATE user_money SET money=money+? WHERE stock_account_id=?",
		[money, user_id],
		(error, result)=>{
			callback(error);
		}
	);
}

function user_stock_add(connection, user_id, stock_id, amount, price, callback){
	async.waterfall([
		(callback)=>{
			connection.query(
				`SELECT COUNT(*) AS count
					FROM stock_holding
					WHERE user_id=? AND stock_id=?`,
				[user_id, stock_id],
				(error, result)=>{
					callback(error, result[0].count);
				});
		},
		(current_count, callback)=>{
			if(current_count == 1){
				connection.query(
					`UPDATE stock_holding
						SET buyin_price = (buyin_price * amount + ? * ?) / (? + amount), amount = amount + ?
						WHERE stock_id = ? AND user_id=?`,
					[price, amount, amount, amount, stock_id, user_id],
					(error, result)=>{
						callback(error);
					}
				);
			}else if(current_count == 0){
				connection.query(
					`INSERT INTO stock_holding
						(user_id, stock_id, amount, buyin_price)
						VALUES(?, ?, ?, ?)`,
					[user_id, stock_id, amount],
					(error, result)=>{
						callback(error);
					}
				);
			}
		}
	], (error)=>{
		if(error){
			console.log("User stock add error" + error);
			console.trace();
		}
		callback(null);
	});
}

function add_history_order(connection, sell_id, buy_id, stock_id, price, amount, callback){
	connection.query(`INSERT INTO history_orders
		(sell_user_id, buy_user_id, stock_id, price, amount)
		VALUES(?, ?, ?, ?, ?)`,
		[sell_id, buy_id, stock_id, price, amount],
		(error, result)=>{
			callback(error);
		}
	);
}

function do_order(connection, stock_id, buy_in_item, sell_out_item, callback){
	let make_price = (buy_in_item.price + sell_out_item.price) / 2.0;
	let make_amout = Math.min(buy_in_item.amount, sell_out_item.amount);
	let buyer_discount = (buy_in_item.price - make_price) * make_amout;
	async.waterfall([
		(callback)=>{
			user_money_add(connection,
				buy_in_item.user_id, buyer_discount, callback);
		},
		(callback)=>{
			user_money_add(connection,
				sell_out_item.user_id, make_amout * make_price, callback);
		},
		(callback)=>{
			user_stock_add(connection,
				buy_in_item.user_id, stock_id, make_amout, make_price, callback);
		},
		(callback)=>{
			add_history_order(connection,
				sell_out_item.user_id, buy_in_item.user_id,
				stock_id, make_price, make_amout, callback);
		}
	],
	(error)=>{
		buy_in_item.amount -= make_amout;
		sell_out_item.amount -= make_amout;
		callback(error);
	});
}

function do_single_exchange(stock_id, connection, callback){
	async.waterfall([
		(callback)=>{
			connection.query(
				`LOCK TABLE active_orders WRITE`,
				(error, result)=>{
					callback(error);
				}
			);
		},
		(callback)=>{
			connection.query(
				`SELECT id, user_id, price, amount, direction, order_time
					FROM active_orders
					WHERE stock_id=? AND direction=TRUE
					ORDER BY price DESC, order_time ASC`, [stock_id], 
					(error, buy_in_list)=>{
						callback(error, buy_in_list);
					});
		},
		(buy_in_list, callback)=>{
			connection.query(
				`SELECT id, user_id, price, amount, direction, order_time
					FROM active_orders
					WHERE stock_id=? AND direction=FALSE
					ORDER BY price ASC, order_time ASC`,
				[stock_id],
				(error, sell_out_list)=>{
					callback(error, buy_in_list, sell_out_list);
				});
		},
		(buy_in_list, sell_out_list, callback)=>{
			connection.query(
				`DELETE FROM active_orders WHERE stock_id=?`,
				[stock_id],
				(error, result)=>{
					callback(error, buy_in_list, sell_out_list);
				});
		},
		(buy_in_list, sell_out_list, callback)=>{
			connection.query(
				`UNLOCK TABLES`,
				(error, result)=>{
					callback(error, buy_in_list, sell_out_list);
				});
		},
		(buy_in_list, sell_out_list, callback)=>{
			async.whilst(
				()=>{
					if(buy_in_list.length == 0 || sell_out_list.length == 0)
						return false;
					return buy_in_list[0].price >= sell_out_list[0].price - 0.000001;
				},
				(callback)=>{
					do_order(connection, stock_id, buy_in_list[0], sell_out_list[0], 
						(error)=>{
							if(buy_in_list[0].amount == 0)
								buy_in_list.splice(0, 1);
							if(sell_out_list[0].amount == 0)
								sell_out_list.splice(0, 1);
							callback(error);
						});
				},
				(error)=>{
					if(error){
						console.trace();
						callback(error);
					}else{
						callback(null, buy_in_list, sell_out_list);
					}
				}
			);
		},
		(buy_in_list, sell_out_list, callback)=>{
			let full_list = buy_in_list.concat(sell_out_list);
			async.eachSeries(
				full_list,
				(stock_item, callback)=>{
					console.log("Addback:"+JSON.stringify(stock_item));
					connection.query(
						`INSERT INTO active_orders
							(id, user_id, stock_id, direction,
							 price, amount, order_time)
							VALUES(?, ?, ?, ?, ?, ?, ?)`,
						[stock_item.id, stock_item.user_id, stock_id,
						stock_item.direction, stock_item.price, stock_item.amount,
						stock_item.order_time],
						(error, result)=>{
							callback(error);
						}
					);
				},
				(error)=>{
					callback(error);
				}
			);
		}
	],
	(error)=>{
		if(error){
			console.log("Single ERROR" + error);
		}
		callback(error);
	});
}

function do_exchange(){
	async.waterfall([
		(callback)=>{
			database.get_connection(callback);
		},
		(connection, callback)=>{
			connection.query(
				"SELECT DISTINCT stock_id FROM active_orders",
				(error, result)=>{
					if(error){
						connection.release();
						callback("Failed SQL");
					}else{
						callback(null, result, connection);
					}
				}
			);
		},
		(result, connection, callback)=>{
			async.eachSeries(
				result,
				(stock_id_item, callback)=>{
					do_single_exchange(stock_id_item.stock_id, connection, callback);
				},
				()=>{
					connection.release();
					callback(null);
				}
			);
		}
	],
	(error)=>{
		if(error)
			console.log(error);
		else{
			console.log('done: ' + counter);
		}
		counter += 1;
	});
}

setInterval(do_exchange, 500);
