"use strict";
let async = require("async");
let database = require("./db");
function getNumberInNormalDistribution(mean,std_dev){
	return mean+(randomNormalDistribution()*std_dev);
}

function randomNormalDistribution(){
	var u=0.0, v=0.0, w=0.0, c=0.0;
	do{
		u=Math.random()*2-1.0;
		v=Math.random()*2-1.0;
		w=u*u+v*v;
	}while(w==0.0||w>=1.0)
	c=Math.sqrt((-2*Math.log(w))/w);
	return u*c;
}

function random_names(){
	let name_list = ["中华","华中","乐快","直播","香水","军工","控股","民生","奇葩","膜蛤","股份","迅捷","复合","破浪","神龙","蓝色","红色","精钢","化工","科技", "绿色", "奇幻", "膜蛤", "续命", "快读", "奇观", "基本法", "钦点", "祸福"];
	return name_list[parseInt(Math.random() * name_list.length)]+name_list[parseInt(Math.random() * name_list.length)];
}

async.waterfall([
	(callback)=>{
		console.log("Init DB");
		database.get_connection(callback);
	},
	(connection, callback)=>{
		console.log("Start");
		let stock_id = 1;
		async.whilst(
			()=>{
				return stock_id < 10000;
			},
			(callback)=>{
				let current_date = new Date(2015, 0, 1);
				let target_date = new Date(2016, 5, 1);
				let current_value = 1.0;
				async.series([
					(callback)=>{
						connection.query("INSERT INTO stock (id, name, base_price, max_change, next_max_change, active) VALUES(?, ?, 1.0, 0.1, 0.1, 1)", [stock_id, random_names()],
							(error, result)=>{
								callback(error);
							});
					},
					(callback)=>{
						async.whilst(
							()=>{
								return target_date.getTime() > current_date.getTime();
							},
							(callback)=>{
								current_date.setTime(current_date.getTime() + Math.random() * 3600 * 9 * 1000);
								let change = getNumberInNormalDistribution(1.0007, 0.01);
								current_value *= change;
								connection.query("INSERT INTO history_orders (stock_id, sell_user_id, buy_user_id, price, amount, complete_time) VALUES (?, 1, 2, ?, 1, ?)",
									[stock_id, current_value, current_date],
									(error, result)=>{
										callback(error);
									});
							},
							(error)=>{
								callback(error);
							}
						);
					},
					(callback)=>{
						connection.query("UPDATE stock SET base_price = current_price_for_stock(id) WHERE id=?", [stock_id],
							(error, result)=>{
								callback(error);
							}
						);
					},
					(callback)=>{
						let active_count = 0;
						async.whilst(
							()=>{
								return active_count < 50;
							},
							(callback)=>{
								let change = getNumberInNormalDistribution(1.0, 0.015);
								let price = current_value * change;
								let direction = (price < current_value);
								let amount = parseInt(Math.random()*15) * 100;
								connection.query("INSERT INTO active_orders (user_id, stock_id, direction, price, amount) VALUES(3, ?, ?, ?, ?)", 
									[stock_id, direction, price, amount],
									(error, result)=>{
										active_count += 1;
										callback(error);
									}
								);
							},
							(error)=>{
								callback(error);
							}
						);
					},
					(callback)=>{
						console.log(stock_id);
						stock_id += 1;
						callback(null);
					}
				], (error)=>{
					callback(error);
				});
			},
			(error)=>{
				callback(error);
			}
		);
	}
],
	(error)=>{
		if(error)
			console.log(error);
		else
			console.log("done");
		process.exit();
	});
