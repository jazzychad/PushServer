
/**
 * Module dependencies.
 */

var express = require('express')
, MongoStore = require('connect-mongo')(express)
, routes = require('./routes')
, config = require('./config')
, mongoose = require('mongoose');

mongoose.connect(config.mongo_uri || "mongodb://localhost/pushserver_test");

var app = express();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.session({
    secret: config.express_session_secret,
    store: new MongoStore({
      url: config.mongo_uri,
      db: "pushserver_sessions",
      auto_reconnect: true,
      clear_interval: 600
    }, function() {console.log("connected to mongo!");})
  }));

  app.use(express.methodOverride());
  app.use(express.static(__dirname + '/public'));
  app.use(app.router);
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// middleware

var admin = function(req, res, next) {
  if (req.session.user && req.session.user.is_admin == true) {
    next();
  } else {
    res.redirect('/');
  }
};


// Routes

app.post('/dev/updateDeviceToken', routes.updateTokenDev);
app.post('/prod/updateDeviceToken', routes.updateTokenProd);

//app.get('/dev/channel/:channel', routes.channelListDev); // logs devices in channel
//app.get('/prod/channel/:channel', routes.channelListProd); // logs devices in channel

//app.post('/dev/push/:channel', routes.pushChannelDev); // for testing push
//app.post('/prod/push/:channel', routes.pushChannelProd); // for testing push

app.get('/channel_list/:token', routes.channelListForDevice);

//// web interface

app.get('/', routes.index);

app.get('/dashboard', admin, routes.pushDashboard);
app.post('/dashboard_push', admin, routes.pushDashboardPost);

//// login auth

app.get('/login', routes.login);
app.get('/logout', routes.logout);
app.get('/oauth/callback', routes.oauth_return);


var port = process.env.PORT || 3000;
app.listen(port, function(){
  console.log("Express server listening on port %d in %s mode", process.env.PORT, app.settings.env);
});
