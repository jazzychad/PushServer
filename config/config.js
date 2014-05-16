/*module.exports.admin_userid = process.env.ADMIN_USERID;

module.exports.sitename = process.env.SITENAME;
module.exports.siteurl = process.env.SITEURL;

module.exports.mongo_uri = process.env.MONGOLAB_URI;

module.exports.gh_consumer_key = process.env.GH_CONSUMER_KEY;
module.exports.gh_consumer_secret = process.env.GH_CONSUMER_SECRET;
module.exports.gh_callback = process.env.GH_CALLBACK;

module.exports.express_session_secret = process.env.EXPRESS_SESSION_SECRET;*/

/**
 * You can even config for different enviroment
 * module.exports = {development: {}, production: {}}
 *
 *
 */
module.exports = {

  admin_userid: process.env.ADMIN_USERID,

  sitename: process.env.SITENAME,

  siteurl: process.env.SITEURL,

  mongo_uri: process.env.MONGOLAB_URI,

  gh_consumer_key: process.env.GH_CONSUMER_KEY,

  gh_consumer_secret: process.env.GH_CONSUMER_SECRET,

  gh_callback: process.env.GH_CALLBACK,

  express_session_secret: process.env.EXPRESS_SESSION_SECRET
};
