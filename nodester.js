var request = require('request');
var querystring = require('querystring');
var fs = require('fs');
var sys = require('sys');

var headers = {'Content-Type': 'application/x-www-form-urlencoded'};
var nodester = function (username, password, basehost) {
  if (typeof baseurl != 'undefined') this.basehost = basehost;
  else this.basehost = 'api.nodester.com';
  this.username = username;
  this.password = password;
  if (typeof this.username != 'undefined' && typeof this.password != 'undefined' && this.username.length > 0 && this.password.length > 0) {
    var userbits = this.username + ":" + this.password + "@";
  } else {
    var userbits = "";
  }
  this.baseurl = "http://" + userbits + this.basehost + "/";
};

nodester.prototype.coupon_request = function (email, cb) {
  request({uri: this.baseurl + "coupon", method: "POST", body: querystring.stringify({email: email}), headers: headers}, function (err, resp, body) {
      cb(JSON.parse(body));
    }
  );
};

nodester.prototype.user_create = function (user, pass, email, rsakey, coupon, cb) {
  var rsadata = fs.readFileSync(rsakey).toString();
  if (rsadata.length < 40) {
    cb("Error: Invalid SSH key file.");
  } else {
    request({
      uri: this.baseurl + "user",
      method: 'POST',
      body: querystring.stringify({
        user: user,
        password: pass,
        email: email,
        coupon: coupon,
        rsakey: rsadata
      }),
      headers: headers
      },
      function (err, resp, body) {
        cb(JSON.parse(body))
      }
    );
  }
};

nodester.prototype.user_setpass = function (newpass, cb) {
  request({uri: this.baseurl + "user", method: 'PUT', body: querystring.stringify({password: newpass}), headers: headers}, function (err, response, body) {
    cb(JSON.parse(body));
  });
};

nodester.prototype.user_setkey = function (rsakey, cb) {
  request({uri: this.baseurl + "user", method: 'PUT', body: querystring.stringify({rsakey: rsakey}), headers: headers}, function (err, response, body) {
    cb(JSON.parse(body));
  });
};

nodester.prototype.apps_list = function (cb) {
  request({uri: this.baseurl + "apps", method: 'GET'}, function (err, response, body) {
    cb(JSON.parse(body));
  });
};

nodester.prototype.app_create = function (name, start, cb) {
  request({uri: this.baseurl + "app", method: 'POST', body: querystring.stringify({appname: name, start: start}), headers: headers}, function (err, response, body) {
    cb(JSON.parse(body));
  });
};

/*
nodester.prototype.app_set_start = function (name, start, cb) {
  
};
*/

nodester.prototype.app_running = function (name, running, cb) {
  request({uri: this.baseurl + "app", method: 'PUT', body: querystring.stringify({appname: name, running: running}), headers: headers}, function (err, response, body) {
    cb(JSON.parse(body));
  });
};

nodester.prototype.app_start = function (name, cb) {
  this.app_running(name, "true", cb);
};

nodester.prototype.app_restart = function (name, cb) {
  this.app_running(name, "restart", cb);
};

nodester.prototype.app_stop = function (name, cb) {
  this.app_running(name, "false", cb);
};

nodester.prototype.app_delete = function (name, cb) {
  
};

nodester.prototype.app_info = function (name, cb) {
  request({uri: this.baseurl + "app/" + name, method: 'GET', headers: headers}, function (err, response, body) {
    cb(JSON.parse(body));
  });
};

nodester.prototype.appnpm_handler = function (name, package, action, cb) {
  request({uri: this.baseurl + "appnpm", method: 'POST', headers: headers, body: querystring.stringify({appname: name, package: package, action: action})}, function (err, response, body) {
    cb(JSON.parse(body));
  });
};

nodester.prototype.appnpm_install = function (name, package, cb) {
  this.appnpm_handler(name, package, "install", cb);
};

nodester.prototype.appnpm_update = function (name, package, cb) {
  this.appnpm_handler(name, package, "update", cb);
};

nodester.prototype.appnpm_uninstall = function (name, package, cb) {
  this.appnpm_handler(name, package, "uninstall", cb);
};

exports.nodester = nodester;
