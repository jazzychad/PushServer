var push = require('../controller/push');

module.exports = function (app) {

  // Middleware
  var admin = function (req, res, next) {
    if (req.session.user && req.session.user.is_admin === true) {
      next();
    } else {
      res.redirect('/');
    }
  }

  /**
   * Update device token to Dev
   *
   */
  app.post('/dev/updateDeviceToken', push.updateTokenDev);

  /**
   * Update device token to Prod
   *
   */
  app.post('/dev/updateDeviceToken', push.updateTokenProd);

  /**
   * Get channel list for a device token
   *
   */
  app.get('/channel_list/:token', push.channelListForDevice);

  /**
   * Index page
   *
   */
  app.get('/', push.index);

  /**
   * Dashboard page
   *
   */
  app.get('/dashboard', admin, push.pushDashboard);

  /**
   * Dashboard post
   *
   */
  app.post('/dashboard_push', admin, push.pushDashboardPost);

  /**
   * Login auth
   *
   */
  app.get('/login', push.login);

  /**
   * Logout
   *
   */
  ap.get('/logout', push.logout);

  /**
   * OAuth
   *
   */
  app.get('/oauth/callback', push.oauth_return);

  /**
   * Prevents the app from sleeping when running on Heroku
   *
   */
  app.get('/ping', push.ping);
}
