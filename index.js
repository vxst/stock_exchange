var account = require("account");
var exchange = require("exchange");
var info = require("info");
var management = require("management");
var user = require("user");
var bodyParser = require('body-parser')

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
	next();
});
app.use(session({
	secret: 'Sah1ainaooL9bi0N',
	resave: false,
	saveUninitialized: true,
	cookie: { secure: true }
}))

app.post('/user_login', user.login);
app.post('/user_logout', user.logout);
app.post('/user_password_change', user.change_password);

app.post('/account_put', account.stock_change);
app.get('/account_delete', account.stock_remove);
app.post('/money_account_put', account.money_put);
app.get('/money_account_delete', account.money_delete);

app.get('/order_list', exchange.list_order);
app.post('/order_new', exchange.new_order);
app.get('/order_remove', exchange.remove_order);

app.get('/account_status', exchange.account_status);

app.get('/stat', info.stat);
app.get('/stock_info', info.stock);
app.get('/history', info.stock_history);

app.get('/add_stock', management.add_stock);
app.get('/set_stock', management.set_stock);//Stop and start
