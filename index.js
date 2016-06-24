var bodyParser = require('body-parser')
var express = require('express');
var app = express();
var session = require('express-session');

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
	response.ok_with_data = function(data){
		response.json({'status':'ok', 'data':data});
	}
	next();
});
app.use(session({
	secret: 'Sah1ainaooL9bi0N',
	resave: false,
	saveUninitialized: true,
	cookie: { secure: true }
}))

var account = require("./account");
var exchange = require("./exchange");
var info = require("./info");
var management = require("./management");
var user = require("./user");

app.post('/user/login', user.login);
app.post('/user/logout', user.logout);
app.post('/user/password_change', user.change_password);

app.get('/stock_account', account.get_stock_account);
app.put('/stock_account', account.put_stock_account);
app.post('/stock_account', account.put_stock_account);
app.del('/stock_account', account.remove_stock_account);
app.post('/stock_account_del', account.remove_stock_account);

app.get('/money_account', account.get_money_account);
app.put('/money_account', account.put_money_account);
app.post('/money_account', account.put_money_account);
app.del('/money_account', account.remove_money_account);
app.post('/money_account_del', account.remove_money_account);

app.get('/order_list', exchange.list_order);
app.post('/order_new', exchange.new_order);
app.get('/order_remove', exchange.remove_order);

app.get('/account_status', exchange.account_status);

app.get('/stat', info.stat);
app.get('/stock_info', info.stock);
app.get('/history', info.stock_history);

app.get('/add_stock', management.add_stock);
app.get('/set_stock', management.set_stock);//Stop and start
