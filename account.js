"use strict";

var database = require("./db");
var user = require("./user");
var async = require("async");

exports.put_stock_account_user = function(request, response){
	var user_id = request.session.user_id;
	var sex = request.body.sex;
	var national_id = request.body.national_id;
	var address = request.body.address;
	var education = request.body.education;
	var work = request.body.work;
	var phone = request.body.phone;

	if(user_id === undefined){
		response.fail();
		return;
	}

	async.waterfall([
		(callback)=>{
			database.get_connection(callback);
		},
		(connection, callback)=>{
			connection.query("UPDATE user SET sex=?, national_id=?, address=?, education=?, work=?, phone=? WHERE user_id=?", [sex, national_id, address, education, work, phone, user_id],
				(error, result)=>{
					connection.release();
					if(error || result.affectedRows != 1){
						response.fail();
					}else{
						response.ok();
					}
					callback(null);
				}
			);
		}
	]);
}

exports.put_stock_account = function(request, response){
	var user_id = request.body.user_id;
	var username = request.body.username;
	var name = request.body.name;
	var password = user.password_encode(request.body.password);
	var password_empty = request.body.password == "";
	var national_id = request.body.national_id;
	var address = request.body.address;
	var work = request.body.work;
	var education = request.body.education;
	var phone = request.body.phone;
	var sex = request.body.sex;

	if(!request.session.is_admin){
		response.fail();
		return;
	}
	
	if(user_id === null){
		async.waterfall([
		    function(callback){
				database.get_connection(callback);
			},
			function(connection, callback){
				connection.query(
					"INSERT INTO user (username, name, password, create_time, national_id, address, work, education, phone, sex) VALUES(?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?)",
					[username, name, password,
					national_id, address, work,
					education, phone, sex],
					function(error, rows){
						connection.release();
						if(error === null)
							response.ok();
						else
							response.fail();
						callback(null);
					}
				);
			}
		]);
	}else{
		async.waterfall([
		    function(callback){
				database.get_connection(callback);
			},
			function(connection, callback){
				if(!password_empty){
					connection.query(
						"UPDATE user SET `username`=?, `name`=?, `password`=?, `national_id`=?, `address`=?, `work`=?, `education`=?, `phone`=?, `sex`=? WHERE `id`=?",
						[username, name, password,
						national_id, address, work,
						education, phone, sex,
						user_id],
						function(error, rows){
							connection.release();
							if(error === null)
								response.ok();
							else
								response.fail();
							callback(null);
						}
					);
				}else{
					connection.query(
						"UPDATE user SET `username`=?, `name`=?, `national_id`=?, `address`=?, `work`=?, `education`=?, `phone`=?, `sex`=? WHERE `id`=?",
						[username, name, 
						national_id, address, work,
						education, phone, sex,
						user_id],
						function(error, rows){
							connection.release();
							if(error === null)
								response.ok();
							else
								response.fail();
							callback(null);
						}
					);
				}
			}
		]);
	}
}

exports.get_stock_account = function(request, response){
	let target_user_id = null;

	if(request.session.is_admin && request.query.user_id !== undefined){
		target_user_id = request.query.user_id;
	}else if(request.session.user_id !== undefined){
		target_user_id = request.session.user_id;
	}else{
		response.fail();
		return;
	}

	async.waterfall([
		function(callback){
			database.get_connection(callback);
		},
		function(connection, callback){
			connection.query("SELECT id, username, name, sex, national_id, address, work, education, phone FROM user WHERE id=?", [target_user_id], function(err, rows){
				connection.release();
				response.ok_with_data(rows[0]);
				callback(null);
			});
		}
	]);
}

exports.remove_stock_account = function(request, response){
	var target_user_id = request.body.user_id;

	if(!request.session.is_admin){
		response.fail();
		return;
	}

	async.waterfall([
		function(callback){
			database.get_connection(callback);
		},
		function(connection, callback){
			connection.query("DELETE FROM user WHERE id=?", [target_user_id],
				function(error, result){
					connection.release();
					if(error || result.affectedRows != 1){
						response.fail();
					}else{
						response.ok();
					}
					callback(null);
				}
			);
		}
	]);
}

exports.put_money_account = function(request, response){
	var user_id = request.body.user_id;
	var stock_account_id = request.body.stock_account_id;
	var password = password_encode(request.body.password);
	var money = request.body.money;

	if(!request.session.is_admin){
		response.fail();
		return;
	}

	if(user_id === null){
		async.waterfall([
			function(callback){
				database.get_connection(callback);
			},
			function(connection, callback){
				connection.query("INSERT INTO user_money (stock_account_id, password, money) VALUES(?, ?, ?)", [stock_account_id, password, money],
					function(error, results){
						connection.release();
						if(error || results.affectedRows != 1){
							response.fail();
						}else{
							response.ok();
						}
						callback(null);
					}
				);
			}
		]);
	}else if(request.body.password == null){
		async.waterfall([
			function(callback){
				database.get_connection(callback);
			},
			function(connection, callback){
				connection.query("UPDATE user_money SET stock_account_id=?,money=? WHERE id=?",[stock_account_id, money, user_id],
					function(error, result){
						connection.release();
						if(error || result.affectedRows != 1){
							response.fail();
						}else{
							response.ok();
						}
						callback(null);
					}
				);
			}
		]);
	}else{
		async.waterfall([
			function(callback){
				database.get_connection(callback);
			},
			function(connection, callback){
				connection.query("UPDATE user_money SET stock_account_id=?,money=?,password=? WHERE id=?",[stock_account_id, money, password, user_id],
					function(error, result){
						connection.release();
						if(error || result.affectedRows != 1){
							response.fail();
						}else{
							response.ok();
						}
						callback(null);
					}
				);
			}
		]);
	}
}

exports.get_money_account = function(request, response){
	let user_id = null;

	if(request.session.is_admin && request.query.user_id !== undefined){
		user_id = request.query.user_id;
	}else if(request.session.user_id !== undefined){
		user_id = request.session.user_id;
	}else{
		response.fail();
		return;
	}

	async.waterfall([
		function(callback){
			database.get_connection(callback);
		},
		function(connection, callback){
			connection.query("SELECT stock_account_id, money FROM user_money WHERE id = ?", [user_id], 
				function(error, result){
					connection.release();
					if(error || result.length != 1){
						response.fail();
					}else{
						response.ok();
					}
					callback(null);
				}
			);
		}
	]);
}

exports.remove_money_account = function(request, response){
	var user_id = request.body.user_id;

	if(!request.session.is_admin){
		response.fail();
		return;
	}

	async.waterfall([
		function(callback){
			database.get_connection(callback);
		},
		function(connection, callback){
			connection.query("DELETE FROM user_money WHERE id = ?", [user_id], 
				function(error, result){
					connection.release();
					if(error || result.affectedRows != 1){
						response.fail();
					}else{
						response.ok();
					}
					callback(null);
				}
			);
		}
	]);
}
