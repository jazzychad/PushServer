var express = require('express'),
    MongoStore = require('connect-mongo')(express);

module.exports = function (app, config) {

  app.use(express.static(__dirname + '/public'));

  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');

  app.configure(function () {

    // cookieParser should above session
    app.use(express.cookieParser());

    // use urlencoded and json to fix connection 3.0 warning
    app.use(express.urlencoded());
    app.use(express.json());
    app.use(express.methodOverride());

    // express/mongo session storage
    app.use(express.session({
      secret: config.express_session_secret,
      store: new MongoStore({
        url: config.mongo_uri,
        db: 'pushserver_sessions',
        clear_interval: 600
      }, function () {
        console.log('connected to mongo!');
      })
    }));

    // routes should be at last
    app.use(app.router);
  });

  // development env config
  app.configure('development', function () {
    app.use(express.errorHandler({ dumpException: true, showStack: true }));
  });

  // production env config
  app.configure('production', function () {
    app.use(express.errorHandler());
  });
}
