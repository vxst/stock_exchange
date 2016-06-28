"use strict";

var database = require("./db");
var async = require("async");

function init_database(){
	database.get_connection(
		function(err, connection){
			async.series([
				function(callback){
					connection.query(`CREATE TABLE IF NOT EXISTS
						user(
							id INT PRIMARY KEY AUTO_INCREMENT,
							username VARCHAR(32),
							name VARCHAR(32),
							password CHAR(36),
							sex VARCHAR(12),
							create_time TIMESTAMP DEFAULT NOW(),
							national_id VARCHAR(32),
							address VARCHAR(255),
							work VARCHAR(32),
							work_place VARCHAR(32),
							education VARCHAR(32),
							phone VARCHAR(32),
							is_admin BOOLEAN,
							UNIQUE INDEX(username)
						)`, callback);
				},
				function(callback){
					connection.query(`CREATE TABLE IF NOT EXISTS
						user_money(
							id INT PRIMARY KEY AUTO_INCREMENT,
							stock_account_id INT,
							password CHAR(36),
							money DOUBLE,
							UNIQUE INDEX(stock_account_id),
							FOREIGN KEY(stock_account_id)
								REFERENCES user(id)
								ON DELETE CASCADE
						)`, callback);
				},
				function(callback){
					connection.query(`CREATE TABLE IF NOT EXISTS
						stock(
							id INT PRIMARY KEY AUTO_INCREMENT,
							name VARCHAR(32),
							base_price DOUBLE,
							max_change DOUBLE,
							next_max_change DOUBLE,
							active BOOLEAN,
							INDEX(id, active)
						)`, callback);
				},
				function(callback){
					connection.query(`CREATE TABLE IF NOT EXISTS
						active_orders(
							id INT PRIMARY KEY AUTO_INCREMENT,
							user_id INT,
							stock_id INT,
							direction BOOLEAN,
							price DOUBLE,
							amount INT,
							order_time TIMESTAMP DEFAULT NOW(),
							INDEX(user_id, stock_id),
							INDEX(direction),
							INDEX(price),
							FOREIGN KEY(user_id)
								REFERENCES user(id)
								ON DELETE CASCADE,
							FOREIGN KEY(stock_id)
								REFERENCES stock(id)
								ON DELETE CASCADE
						)`, callback);
				},
				function(callback){
					connection.query(`CREATE TABLE IF NOT EXISTS
						history_orders(
							id INT PRIMARY KEY AUTO_INCREMENT,
							stock_id INT,
							sell_user_id INT,
							buy_user_id INT,
							price DOUBLE,
							amount INT,
							complete_time TIMESTAMP DEFAULT NOW(),
							INDEX(stock_id),
							INDEX(sell_user_id),
							INDEX(buy_user_id),
							FOREIGN KEY(stock_id)
								REFERENCES stock(id)
								ON DELETE CASCADE,
							FOREIGN KEY(sell_user_id)
								REFERENCES user(id)
								ON DELETE SET NULL,
							FOREIGN KEY(buy_user_id)
								REFERENCES user(id)
								ON DELETE SET NULL
						)`, callback);
				},
				function(callback){
					connection.query(`CREATE TABLE IF NOT EXISTS
						stock_holding(
							id INT PRIMARY KEY AUTO_INCREMENT,
							user_id INT,
							stock_id INT,
							amount INT,
							buyin_price DOUBLE,
							INDEX(user_id),
							INDEX(stock_id),
							FOREIGN KEY(user_id)
								REFERENCES user(id)
								ON DELETE CASCADE,
							FOREIGN KEY(stock_id)
								REFERENCES stock(id)
								ON DELETE CASCADE
						)`, callback);
				},
				function(callback){
					connection.release();
					callback(null);
				}
			],
			function(error){
				if(error){
					console.log(error);
				}
			});
		}
	);
}

init_database();
