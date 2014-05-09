var express = require('express'),
    mongoose = require('mongoose'),
    config = require('./config/config'),
    request = require('request'),
    app = express();

// Bootstrap db connection
// connect to the mongodb
var connect = function () {
  var options = { server: { socketOptions: { keepAlive: 1 } } };
  mongoose.connect(config.mongo_uri || 'mongodb://localhost/pushserver_test');
};
connect();

// Error handler
mongoose.connection.on('error', function (err) {
  console.log(err);
});

// Reconnect when closed
mongoose.connection.on('disconnected', function () {
  connect();
});

// Bootstrap exress settings
require('./config/express')(app, config);

// Bootstrap routes
require('./routes')(app);

// Actually this may has problems
setInterval(function () {
  request(config.siteurl + '/ping');
}, 60000);

// Start the app by listening at <port>
var port = process.env.PORT || 3000;
app.listen(port, function(){
  console.log("Express server listening on port %d in %s mode", process.env.PORT, app.settings.env);
});
