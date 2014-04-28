var request = require('request');
var qs = require('querystring');
var sys = require('util');
var GitHubApi = require('github');

module.exports.GHAPI = function(access_token) {

  var self = this;


  this.api_base = "https://api.github.com/";
  this.host = "api.github.com";
  this.port = 443;
  this.api_path_base = "/";
  this.access_token = access_token;

  this.client = new GitHubApi({
     version: "3.0.0"
  });

  var requestCallback = function(callback) {
    return function(err, res, data) {
      if (err) {
        callback(err, res, data);
      } else {
        callback(null, res, JSON.parse(data));
      }
    };
  };

  var JSON_stringify = function(s, emit_unicode) {
    var json;
    json = JSON.stringify(s);
    if (emit_unicode) {
      return json;
    }
    return json.replace(/[\u007f-\uffff]/g, function(c) {
      return '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4);
    });
  };


  var get = function(path, params, callback) {
    if (arguments.length == 2) {
      callback = params;
      params = {access_token: self.access_token};
    } else {
      if (!params.access_token) {
        params.access_token = self.access_token;
      }
    }
    var full_path = self.api_base + path + "?" + qs.stringify(params);
    console.log(full_path);
    request(full_path, requestCallback(callback));
  };

  var post = function(path, params, callback) {
    if (!params.access_token) {
        params.access_token = self.access_token;
    }
    var opts = {
      uri: self.api_base + path,
      method: "POST",
      headers: {
        "Authorization": "Bearer " + params.access_token,
        "Content-type": "application/json"
      },
      body: JSON_stringify(params)
    };
    console.log(sys.inspect(opts));
    var finalCallback = requestCallback(callback);
    request(opts, finalCallback);

  };

  var oauth_post = function(path, params, callback) {
    var opts = {
      uri: path,
      method: "POST",
      headers: {
        "Content-type": "application/json"
      },
      body: JSON_stringify(params)
    };
    console.log(sys.inspect(opts));
    var finalCallback = requestCallback(callback);
    request(opts, finalCallback);

  };

  this.getAccessToken = function(code, callback) {
    oauth_post("https://github.com/login/oauth/access_token", {code: code, client_id: process.env.GH_CONSUMER_KEY, client_secret: process.env.GH_CONSUMER_SECRET}, callback);
  };

  this.request = function(gh_func, opts, callback) {
    if (this.access_token) {
      this.client.authenticate({type: "oauth", "token": this.access_token});
    }
    gh_func(opts, callback);
  };
};