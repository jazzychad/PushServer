var config = require("../config");
var GHAPI = require("../gh-api").GHAPI;
//var GitHubApi = require("github");

var Device = require("../models/device").Device;
var User = require("../models/user").User;

var apns = require("apn");

var _log = function(msg) {

  console.log(msg);
};

var arrRemove = function (arr) {
  var what, a = arguments, L = a.length, ax;
  while (L > 1 && arr.length) {
    what = a[--L];
    while ((ax= arr.indexOf(what)) !== -1) {
      arr.splice(ax, 1);
    }
  }
  return arr;
};


function getClientIp(req) {

  var ipAddress;
  // Amazon EC2 / Heroku workaround to get real client IP
  var forwardedIpsStr = req.header('x-forwarded-for');
  if (forwardedIpsStr) {

    // 'x-forwarded-for' header may return multiple IP addresses in
    // the format: "client IP, proxy 1 IP, proxy 2 IP" so take the
    // the first one
    var forwardedIps = forwardedIpsStr.split(',');
    ipAddress = forwardedIps[0];
  }
  if (!ipAddress) {
    // Ensure getting client IP address still works in
    // development environment
    ipAddress = req.connection.remoteAddress;
  }
  return ipAddress;
};

/*
 * GET home page.
 */

exports.index = function(req, res) {
  render(req, res, "index");
  //res.end('Hello World');
};


exports.updateTokenDev = function(req, res) {
  updateToken(req, res, false);
};

exports.updateTokenProd = function(req, res) {
  updateToken(req, res, true);
};

var updateToken = function(req, res, isProduction) {
  var deviceToken = req.body.deviceToken;
  var channels = (req.body.channels && req.body.channels.length) ? req.body.channels.split(",") : [];
  var unsubscribe = (req.body.unsubscribe && req.body.unsubscribe === "true") ? true : false;

  _log(deviceToken);
  _log(unsubscribe);

  Device.findOne({deviceToken: deviceToken}, function(err, device) {
                   if (err) {
                     console.log("ERROR: " + err);
                     res.end("error");
                   }
                   if (!device) {
                     _log("no device!");
                     device = new Device();
                     device.deviceToken = deviceToken;
                     device.channels = [];
                   } else {
                     _log("found device!");
                     // device exists
                   }

                   if (channels.length) {
                     if (unsubscribe) {
                       // unsubscribe from channels
                       for (var i in channels) {
                         var channel = channels[i];
                         arrRemove(device.channels, channel);
                       }

                     } else {
                       // subscribe to the channels
                       for (var i in channels) {
                         var channel = channels[i];
                         if (device.channels.indexOf(channel) === -1) {
                           device.channels.push(channel);
                         }
                     }

                     }
                   }

                   device.valid = true;
                   device.production = isProduction;
                   device.updatedAt = new Date();
                   device.save(function(e,d){});
                   res.end('updated. for production: ' + isProduction);
                 });
};

exports.channelListDev = function(req, res) {
  channelList(req, res, false);
};

exports.channelListProd = function(req, res) {
  channelList(req, res, true);
};

var channelList = function(req, res, isProduction) {
  var channel = req.params.channel;
  _log("looking for channel: " + channel);
  getDevicesForChannel(channel, isProduction, function(err, devices) {
                         if (err) {
                           res.end('error! ' + error);
                         }
                         res.end('ok');
                       });
};

exports.pushChannelDev = function(req, res) {
  pushChannel(req, res, false);
};

exports.pushChannelProd = function(req, res) {
  pushChannel(req, res, true);
};

var validateDeviceToken = function(token) {
  if (token.length < 64) {
    return false;
  }
  return true;
};

var pushChannel = function(req, res, isProduction) {
  var channel = req.params.channel;
  var message = req.body.message;
  var badge = parseInt(req.body.badge, 10) || 0;

  doPushChannel(channel, message, badge, isProduction, function(err) {
                  if (err) {
                    res.end('error! ' + err);
                  } else {
                    res.end('pushed!');
                  }
                });
};

var doPushChannel = function(channel, message, badge, isProduction, callback) {
  _log("badge " + badge);
  _log("pushing to channel: " + channel);
  getDevicesForChannel(channel, isProduction, function(err, devices) {
    if (err) {
      callback(err); //res.end("error pushing! " + err);
    }
    if (devices) {

      var connectionOptions = {
        cert: "certs/apns_" + (isProduction ? "prod" : "dev") + "_cert.pem",
        key: "certs/apns_" + (isProduction ? "prod" : "dev") + "_key.unencrypted.pem",
        production: isProduction
        /* legacy: true */
      };

      var apnsConnection = new apns.Connection(connectionOptions);

      apnsConnection.on("connected", function(openSockets) {
                          _log("connected to apns!");
                        });

      apnsConnection.on("disconnected", function(openSockets) {
                          _log("disconnected from apns!");
                        });

      apnsConnection.on("transmitted", function(note, device) {
                          _log("sent note to device: " + device);
                        });

      apnsConnection.on("error", function(err) {
                          _log("apns connection error: " + err);
                        });

      apnsConnection.on("socketError", function(err) {
                          _log("socket error: " + error);
                        });

      for (var i in devices) {
        var device = devices[i];
        var deviceToken = device.deviceToken;

        if (!validateDeviceToken(deviceToken)) {
          continue;
        }

        var apnsDevice = new apns.Device(deviceToken);

        var note = new apns.Notification();
        note.badge = badge;
        note.alert = message;
        note.sound = "default";

        apnsConnection.pushNotification(note, apnsDevice);

        _log("sending note to deviceToken: " + deviceToken);
      }

      apnsConnection.shutdown();
      callback(null); //res.end('pushed to devices! ' + devices.length);

    } else {
      callback(null); //res.end('no devices to push to!');
    }
  });
};

exports.channelListForDevice = function(req, res) {
  var deviceToken = req.params.token;
  if (!deviceToken) {
    res.end('no token!');
  } else {
    getDevicesForToken(deviceToken, function(err, devices) {
      if (err) {
        res.send(500, 'error! ' + err);
        res.end();
      } else if (devices.length) {
        // we're looking up by token, so we only want one result
        var device = devices[0];
        res.end(device.channels.join(','));
      } else {
        res.send(404, 'no devices found');
        res.end();
      }
    });
  }
};

var getDevicesForToken = function(deviceToken, callback) {
  var query = {
    deviceToken: deviceToken
  };

  queryDevices(query, callback);
};

var getDevicesForChannel = function(channel, isProduction, callback) {
    var query = {
      valid: true,
      production: isProduction,
      channels: {
        "$in" : [channel]
      }
    };
  queryDevices(query, callback);

//   Device.find(query, function(err, devices) {
//                 if (err) {
//                   callback(err, null);
//                 } else if (devices) {
//                   _log("found some devices! " + devices.length);
//                   _log(devices);
//                   callback(null, devices);
//                 } else {
//                   callback(null, null);
//                 }

//               });

};

var queryDevices = function(query, callback) {

  Device.find(query, function(err, devices) {
                if (err) {
                  callback(err, null);
                } else if (devices) {
                  _log("found some devices! " + devices.length);
                  _log(devices);
                  callback(null, devices);
                } else {
                  callback(null, null);
                }

              });
};

//////// web interface

var render = function(req, res, path, opts) {
  opts = opts || {};
  opts.title = config.sitename;
  if (req.session.user) {
    opts.user = req.session.user;
  }
  res.render(path, opts);
};


exports.pushDashboard = function(req, res) {

  render(req, res, "dashboard");

};

exports.pushDashboardPost = function(req, res) {
  var channel = req.body.push_channel;
  var message = req.body.push_message;
  var badge = parseInt(req.body.push_badge, 10) || 0;
  var environment = req.body.push_environment;

  var isProduction = (environment === "prod") ? true : false;

  doPushChannel(channel, message, badge, isProduction, function(err) {
    if (err) {
      res.send(500, "error sending push! " + err);
      res.end();
    } else {

      render(req, res, "push_success");
    }
  });
};


////////// login auth

exports.login = function(req, res) {
  res.redirect("https://github.com/login/oauth/authorize?client_id=" + config.gh_consumer_key + "&response_type=token&redirect_uri=" + config.gh_callback);
};

exports.logout = function(req, res) {
  req.session.destroy(function(err) {
    if (err) {
      console.log("error logging out: " + err);
    }
    res.redirect("/");
  });
};

exports.oauth_return = function(req, res) {
  console.log("code is: " + req.query.code);
  var ghapi = new GHAPI();
  ghapi.getAccessToken(req.query.code, function(err, result, data) {
    console.log(data);
    console.log("got access token: " + data.access_token);
    if (data.error) {
      res.end('error: ' + data.error);
      return;
    }
    //github.authenticate({type: "oauth", "token": data.access_token});
    //console.log('kicking off get.user');
    //github.user.get({}, function(err, user) {
    ghapi.access_token = data.access_token;
    ghapi.request(ghapi.client.user.get, {}, function(err, user) {
      console.log("got user result: " + JSON.stringify(user));
      req.session.user = {
        "userid": user.id.toString(),
        "username": user.login,
        "avatar": user.avatar_url,
        "access_token": data.access_token,
        "is_admin": user.id.toString() === config.admin_userid ? true : false,
        "name": user.name
      };
                    console.log('user.id: ' + user.id.toString());
                    console.log('config.admin: ' + config.admin_userid);

      User.findOne({gh_userid: user.id}, function(err, doc) {
        if (err) {
          console.log("ERROR: " + err);
          res.end('error');
          return;
        }
        if (!doc) {
          doc = new User();
        }
        doc.username = user.login;
        doc.gh_userid = user.id.toString();
        doc.name = user.name;
        doc.gh_access_token = data.access_token;
        doc.avatar = user.avatar_url;
        doc.is_admin = user.id.toString() === config.admin_userid ? true : false;
        doc.save(function(e,d){});

        res.redirect('/');
      });
    });
  });
};
