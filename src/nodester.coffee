request = require 'request'
querystring = require 'querystring'
fs = require 'fs'
encode = encodeURIComponent

class Nodester 
  constructor: (@username, @password, @basehost, @secure) ->
    @basehost ?= 'api.nodester.com'
    @protocol = if @secure then 'https://' else 'http://'
    @baseurl = "#{@protocol}#{encode(username)}:#{encode(@password)}@#{basehost}/"
    
  request: (method, path, body, cb) ->
    req = 
      uri: @baseurl + encodeURI(path)
      method: method
      body: querystring.stringify(body)
      headers: 
        'Content-Type': 'application/x-www-form-urlencoded'
      proxy: process.env.http_proxy
    console.log req if process.env.debug?
    request req, handleResponse cb
    
  get: (path, cb) -> @request "GET", path, null, cb
  post: (path, body, cb) -> @request "POST", path, body, cb
  put: (path, body, cb) -> @request "PUT", path, body, cb
  del: (path, body, cb) -> @request "DELETE", path, body, cb
  
  status: (cb) -> @get "status", cb
  coupon_request: (email, cb) -> @post "coupon", {email: email}, cb
  
  user_delete = (user, cb) -> @del "user/#{user}", cb
  user_create: (user, pass, email, rsakey, coupon, cb) ->
    rsadata = fs.readFileSync rsakey
    return cb message: "No RSA key found in #{ rsakey }" unless rsadata
    return cb message: "Invalid SSH key file." unless rsadata.length > 40
    postData =
      user: user
      password: pass
      email: email
      coupon: coupon
      rsakey: rsadata
    @post "user", postData, cb
    
  user_sendtoken: (some_user, cb) -> @post "reset_password", {user: some_user}, cb
  user_setpass: (token, a_password, cb) -> @put "reset_password/#{ token }", {password: a_password}, cb
  user_setkey: (rsakey, cb) -> @put "user", rsakey: rsakey, cb
  apps_list: (cb) -> @get "apps", cb

  app_create: (name, start, cb) -> @post "apps", {appname: name, start: start}, cb
  
  app_running: (name, running, cb) -> @put "apps/#{name}", {running: running}, cb
  app_edit: (name, file, cb) -> @put "apps/#{name}", {start: file}, cb
  app_start: (name, cb) -> @app_running name, "true", cb
  app_restart: (name, cb) -> @app_running name, "restart", cb
  app_stop: (name, cb) -> @app_running name, "false", cb
  
  app_delete: (name, cb) -> @del "apps/#{name}", cb
  app_gitreset: (name, cb) -> @del "gitreset/#{name}", cb
  app_info: (name, cb) -> @get "app/#{name}", cb
  app_logs: (name, cb) -> @get "applogs/#{name}", cb
  
  appnpm_handler: (name, pack, action, cb) -> @post "appnpm", {appname: name, package: pack, action: action}, cb
  appnpm_install: (name, pack, cb) -> @appnpm_handler name, pack, "install", cb
  appnpm_list: (name, cb) -> @appnpm_handler name, "", "list", cb # TODO: Test
  appnpm_update: (name, pack, cb) -> @appnpm_handler name, pack, "update", cb
  appnpm_uninstall: (name, pack, cb) -> @appnpm_handler name, pack, "uninstall", cb
  
  appdomain_add: (name, domain, cb) -> @post "appdomains", {appname: name, domain: domain}, cb
  appdomain_delete: (name, domain, cb) -> @del "appdomains", {appname: name, domain: domain}, cb

  appdomains: (cb) -> @get "appdomains", cb

  env_set: (name, key, value, cb) -> @put "env", {appname: name, key: key, value: value}, cb
  env_delete: (name, key, cb) -> @del "env/#{escape(name)}/#{escape(key)}", cb
  env_get: (name, cb) -> @get "env/#{escape(name)}", cb
  
handleResponse = (cb) ->
  return (err, res, body) =>  
    errCode = res.statusCode if res? and res.statusCode > 400
    if body?
      try
        success = JSON.parse body
      catch e
        errCause = "JSON Parse error!"

    if errCode then errCause = "HTTP Error #{ errCode } returned."
    if success?.message? and success?.status? and not /^success/.exec success.status then errCause = success.message
    errCause ?= "No response received." unless body
    
    if errCause
      error = {}
      error.code = errCode
      error.message = "Fatal Error! API Response: #{ body }\nReason: #{ errCause }"
       
    cb? error, success, {response: body, errorCode: errCode}
      
module.exports.nodester = Nodester
