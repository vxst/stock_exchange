"use strict";

var bodyParser = require('body-parser')
var express = require('express');
var app = express();
var session = require('express-session');

app.set('trust proxy', 1);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	  extended: true
}));
app.use(function(request, response, next){
	response.ok = function(){
		response.json({'status':'ok'});
	}
	response.fail = function(){
		response.json({'status':'fail'});
	}
	response.fail_with_message = function(message){
		response.json({'status':'fail', 'message': message});
	}
	response.assert = function(){
		console.log("ASSERT SITUATION HAPPENED, Database INCONSISTENT, Program UNSTABLE");
		console.trace();
		response.json({'status':'critical system fail'});
	}
	response.ok_with_data = function(data){
		response.json({'status':'ok', 'data':data});
	}
	next();
});
app.use(session({
	secret: 'Sah1ainaooL9bi0N',
	resave: false,
	saveUninitialized: true
}))

var account = require("./account");
var exchange = require("./exchange");
var info = require("./info");
var management = require("./management");
var user = require("./user");

app.post('/user/login', user.login);
app.post('/user/logout', user.logout);
app.get('/user/info', user.info);
app.post('/user/password_change', user.change_password);

app.get('/stock_account', account.get_stock_account);
app.put('/stock_account', account.put_stock_account);
app.post('/stock_account', account.put_stock_account);
app.post('/stock_account_user', account.put_stock_account_user);
app.delete('/stock_account', account.remove_stock_account);
app.post('/stock_account_del', account.remove_stock_account);

app.get('/money_account', account.get_money_account);
app.put('/money_account', account.put_money_account);
app.post('/money_account', account.put_money_account);
app.delete('/money_account', account.remove_money_account);
app.post('/money_account_del', account.remove_money_account);

app.get('/orders', exchange.get_orders);
app.post('/order_new', exchange.new_order);
app.get('/order_remove', exchange.remove_order);
app.delete('/order', exchange.remove_order);
app.get('/stock', exchange.get_stocks);

app.get('/stock_info', info.stock_info);
app.get('/stock_search', info.search_stock);
app.get('/stock_history', info.stock_history);

app.post('/add_stock', management.add_stock);
app.post('/edit_stock', management.edit_stock);//Stop and start
app.post('/turn_stock', management.turn_stock);

app.listen(3000, function () {
	console.log('App Started On Port 3000!');
});
