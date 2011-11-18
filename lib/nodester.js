(function() {
  var Nodester, fs, handleResponse, querystring, request;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  request = require('request');
  querystring = require('querystring');
  fs = require('fs');
  Nodester = (function() {
    var user_delete;
    function Nodester(username, password, basehost, secure) {
      var _ref;
      this.username = username;
      this.password = password;
      this.basehost = basehost;
      this.secure = secure;
      if ((_ref = this.basehost) == null) {
        this.basehost = 'api.nodester.com';
      }
      this.protocol = this.secure ? 'https://' : 'http://';
      this.baseurl = "" + this.protocol + username + ":" + this.password + "@" + basehost + "/";
    }
    Nodester.prototype.request = function(method, path, body, cb) {
      var req;
      req = {
        uri: this.baseurl + path,
        method: method,
        body: querystring.stringify(body),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        proxy: process.env.http_proxy
      };
      return request(req, handleResponse(cb));
    };
    Nodester.prototype.get = function(path, cb) {
      return this.request("GET", path, null, cb);
    };
    Nodester.prototype.post = function(path, body, cb) {
      return this.request("POST", path, body, cb);
    };
    Nodester.prototype.put = function(path, body, cb) {
      return this.request("PUT", path, body, cb);
    };
    Nodester.prototype.del = function(path, body, cb) {
      return this.request("DELETE", path, body, cb);
    };
    Nodester.prototype.status = function(cb) {
      return this.get("status", cb);
    };
    Nodester.prototype.coupon_request = function(email, cb) {
      return this.post("coupon", {
        email: email
      }, cb);
    };
    user_delete = function(user, cb) {
      return this.del("user", {
        user: user
      }, cb);
    };
    Nodester.prototype.user_create = function(user, pass, email, rsakey, coupon, cb) {
      var postData, rsadata;
      rsadata = fs.readFileSync(rsadata);
      return cb({
        message: !rsadata ? "No RSA key found in " + rsakey : void 0
      });
      return cb({
        message: !(rsadata.length > 40) ? "Invalid SSH key file." : void 0
      });
      postData = {
        user: user,
        password: pass,
        email: email,
        coupon: coupon,
        rsakey: rsadata
      };
      return this.post("user", postData, cb);
    };
    Nodester.prototype.user_sendtoken = function(some_user, cb) {
      return this.post("reset_password", {
        user: some_user
      }, cb);
    };
    Nodester.prototype.user_setpass = function(token, a_password, cb) {
      return this.put("reset_password/" + token, {
        password: a_password
      }, cb);
    };
    Nodester.prototype.user_setkey = function(rsakey, cb) {
      return this.put("user", {
        rsakey: rsakey
      }, cb);
    };
    Nodester.prototype.apps_list = function(cb) {
      return this.get("apps", cb);
    };
    Nodester.prototype.app_create = function(name, start, cb) {
      return this.post("app", {
        appname: name,
        start: start
      }, cb);
    };
    Nodester.prototype.app_running = function(name, running, cb) {
      return this.put("app", {
        appname: name,
        running: running
      }, cb);
    };
    Nodester.prototype.app_start = function(name, cb) {
      return this.app_running(name, "true", cb);
    };
    Nodester.prototype.app_restart = function(name, cb) {
      return this.app_running(name, "restart", cb);
    };
    Nodester.prototype.app_stop = function(name, cb) {
      return this.app_running(name, "false", cb);
    };
    Nodester.prototype.app_delete = function(name, cb) {
      return this.del("app", {
        appname: name
      }, cb);
    };
    Nodester.prototype.app_gitreset = function(name, cb) {
      return this.del("gitreset", {
        appname: name
      }, cb);
    };
    Nodester.prototype.app_info = function(name, cb) {
      return this.get("app/" + name, cb);
    };
    Nodester.prototype.app_logs = function(name, cb) {
      return this.get("applogs/" + name, cb);
    };
    Nodester.prototype.appnpm_handler = function(name, package, action, cb) {
      return this.post("appnpm", {
        appname: name,
        package: package,
        action: action
      }, cb);
    };
    Nodester.prototype.appnpm_install = function(name, package, cb) {
      return this.appnpm_handler(name, package, "install", cb);
    };
    Nodester.prototype.appnpm_list = function(name, cb) {
      return this.appnpm_handler(name, "", "list", cb);
    };
    Nodester.prototype.appnpm_update = function(name, package, cb) {
      return this.appnpm_handler(name, package, "update", cb);
    };
    Nodester.prototype.appnpm_uninstall = function(name, package, cb) {
      return this.appnpm_handler(name, package, "uninstall", cb);
    };
    Nodester.prototype.appdomain_add = function(name, domain, cb) {
      return this.post("appdomains", {
        appname: name,
        domain: domain
      }, cb);
    };
    Nodester.prototype.appdomain_delete = function(name, domain, cb) {
      return this.del("appdomains", {
        appname: name,
        domain: domain
      }, cb);
    };
    Nodester.prototype.appdomains = function(cb) {
      return this.get("appdomains", cb);
    };
    return Nodester;
  })();
  handleResponse = function(cb) {
    return __bind(function(err, res, body) {
      var errCause, errCode, error, success;
      if ((res != null) && res.statusCode > 400) {
        errCode = res.statusCode;
      }
      if (body != null) {
        try {
          success = JSON.parse(body);
        } catch (e) {
          errCause = "JSON Parse error!";
        }
      }
      if (errCode) {
        errCause = "HTTP Error " + errCode + " returned.";
      }
      if (((success != null ? success.message : void 0) != null) && ((success != null ? success.status : void 0) != null) && !/^success/.exec(success.status)) {
        errCause = success.message;
      }
      if (!body) {
        if (errCause == null) {
          errCause = "No response received.";
        }
      }
      if (errCause) {
        error = {};
        error.code = errCode;
        error.message = "Fatal Error! API Response: " + body + "\nReason: " + errCause;
      }
      return typeof cb === "function" ? cb(error, success, {
        response: body,
        errorCode: errCode
      }) : void 0;
    }, this);
  };
  module.exports.nodester = Nodester;
}).call(this);
