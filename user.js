var database = require("./db");
var crypto = require('crypto');

// Password->20 char encoded password, 80 bits with 16 bits salt
exports.password_encode = function(password){
	var salt = crypto.randomBytes(2).toString('hex')
	var encoded = crypto.pbkdf2Sync(password, salt, 120, 16, 'sha256').toString('hex');
	return encoded + salt;
}

let password_encode = exports.password_encode;

exports.login = function(request, response){
	var username = request.body.username;
	var password = password_encode(request.body.password);

	database.get_counection(
		function(error, connection){
			connection.query("SELECT id, is_admin FROM user WHERE username=? AND password=?",
				[username, password], 
				function(error, result, fields){
					connection.release();
					if(result.length == 1){
						request.session.user_id = result[0]['id'];
						request.session.is_admin = result[0]['is_admin'];
						response.ok();
					}else{
						response.fail();
					}
				}
			);
		}
	);
}

exports.logout = function(request, response){
	request.session.user_id = null;
	request.session.is_admin = null;
	response.ok();
}

exports.change_password = function(request, response){
	var old_password = password_encode(request.body.old_password);
	var new_password = password_encode(request.body.new_password);
	var user_id = request.user_id;

	database.get_counection(
		function(error, connection){
			connection.query("UPDATE user SET password = ? WHERE id = ? AND password = ?",
				[new_password, user_id, old_password],
				function(error, result, fields){
					connection.release();
					if(result.affectedRows == 1){
						response.ok();
					}else{
						response.fail();
					}
				}
			);
		}
	);
}
