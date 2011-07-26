var request = require('request');
var querystring = require('querystring');
var fs = require('fs');
var sys = require('sys');

var headers = {'Content-Type': 'application/x-www-form-urlencoded'};
var nodester = function (username, password, basehost, secure) {
  if (typeof basehost != 'undefined') this.basehost = basehost;
  else this.basehost = 'api.nodester.com';
  if (typeof secure != 'undefined' && secure == true) this.proto = 'https://';
  else this.proto = 'http://';
  this.username = username;
  this.password = password;
  if (typeof this.username != 'undefined' && typeof this.password != 'undefined' && this.username.length > 0 && this.password.length > 0) {
    var userbits = this.username + ":" + this.password + "@";
  } else {
    var userbits = "";
  }
  this.baseurl = this.proto + userbits + this.basehost + "/";
};

function process_response(cb, errfn) {
  return function(err, response, body) {
    var errCode = null;
    if (!err && response && response.statusCode >= 400) {
      errCode = response.statusCode;
    }
    var data = {};
    try {
      data = JSON.parse(body);
    } catch (e) {
      if (!err) err = { message: body };
      data = body;
    }
    if (errfn) {
      if (!err) err = errfn(data);
    } else {
      if (!err && data.status && !/^success/.exec(data.status)) err = { message: data.status }
    }
    if (errCode) {
      if (err) { err.code = errCode; err.message = '[HTTP ' + errCode + '] ' + err.message; }
      else err = { code: errCode, message: "HTTP Error " + errCode };
    }
    cb(err, data);
  }
}

nodester.prototype.request = function(method, path, body, cb) {
  request({
      uri: this.baseurl + path,
      method: method,
      body: querystring.stringify(body),
      headers: headers,
      proxy: process.env.http_proxy
    },
    process_response(cb)
  );
}

nodester.prototype.get =  function(path, cb)       { this.request('GET',    path, null, cb); }
nodester.prototype.post = function(path, body, cb) { this.request('POST',   path, body, cb); }
nodester.prototype.put =  function(path, body, cb) { this.request('PUT',    path, body, cb); }
nodester.prototype.del =  function(path, body, cb) { this.request('DELETE', path, body, cb); }

nodester.prototype.coupon_request = function (email, cb) {
  this.post('coupon', { email: email }, cb)
}

nodester.prototype.user_create = function (user, pass, email, rsakey, coupon, cb) {
  fs.readFile(rsakey, 'ascii', function(err, rsadata) {
    if (err) cb(err, null);
    if (rsadata.length < 40) {
      cb({ message: "Error: Invalid SSH key file." });
    } else {
      this.post('user', { user: user, password: pass, email: email, coupon: coupon, rsakey: rsadata }, cb);
    }
  }.bind(this));
};

nodester.prototype.user_delete = function (user, cb) {
  this.del('user', { user: user }, cb);
};

nodester.prototype.user_setpass = function (newpass, cb) {
  this.put('user', { password: newpass }, cb);
};

nodester.prototype.user_setkey = function (rsakey, cb) {
  this.put('user', { rsakey: rsakey }, cb);
};

nodester.prototype.apps_list = function (cb) {
  this.get('apps', cb);
};

nodester.prototype.app_create = function (name, start, cb) {
  this.post('app', { appname: name, start: start }, cb);
};

nodester.prototype.status = function (cb) {
  this.get('status', cb);
};

/*
nodester.prototype.app_set_start = function (name, start, cb) {
  
};
*/

nodester.prototype.app_running = function (name, running, cb) {
  this.put('app', { appname: name, running: running }, cb);
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
  this.del('app', { appname: name }, cb);
};

nodester.prototype.app_gitreset = function (name, cb) {
  this.del('gitreset', { appname: name }, cb);
};

nodester.prototype.app_info = function (name, cb) {
  this.get('app/' + name, cb);
};

nodester.prototype.app_logs = function (name, cb) {
  this.get('applogs/' + name, cb);
};

nodester.prototype.appnpm_handler = function (name, package, action, cb) {
  this.post('appnpm', { appname: name, package: package, action: action }, cb);
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

/*
nodester.prototype.appdomain_handler = function (name, domain, action, cb) {
  this.post('appdomains', { appname: name, action: action, domain: domain }, cb);
};
nodester.prototype.appdomain_delete = function (name, domain, cb) {
  this.appdomain_handler(name, domain, "delete", cb);
};
*/

nodester.prototype.appdomain_add = function (name, domain, cb) {
    this.post('appdomains', { appname: name, domain: domain }, cb);
};

nodester.prototype.appdomain_delete = function (name, domain, cb) {
    this.del('appdomains', { appname: name, domain: domain }, cb);
};


nodester.prototype.appdomains = function(cb) {
  this.get('appdomains', cb);
};

nodester.prototype.password_reset_token = function(some_user, cb) {
  this.post('reset_password', { user: some_user }, cb);
};

nodester.prototype.password_reset_setpass = function(token, a_password, cb) {
  this.put('reset_password/'+token, { password: a_password }, cb);
};

exports.nodester = nodester;
