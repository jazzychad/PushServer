I built PushServer as a way to send push notifications for my new app
[Letters - a game about spelling
words](https://itunes.apple.com/us/app/letters-game-about-spelling/id823334911?ls=1&mt=8). Please
check it out!

# PushServer

A nodejs server that runs on heroku for sending Apple APNS push notifications.

Uses mongodb to store device token information and subscribed channel lists.

- Provides API to udpate device tokens for the sandbox and production environments.
- Provides API to subscribe/unsubscribe devices to/from channels
- Provices web interface to send push notifications to channels (using
  Github auth for admin login)

## APNS Push Certificates

Setup your app for Remote Push Notifications using [the
docs](https://developer.apple.com/library/ios/documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/Chapters/ApplePushService.html)
and download the Remote Push Notifications certificate `.cer` files
for Development and Production. Import them both into your keychain.

Open Keychain Access and export both the certificate *and* private key
(highlight them both) to a `.p12` file. I recommend saving them as:

```
apns_dev_Certificates.p12
apns_prod_Certificates.p12
```

Then create the corresponding `.pem` files:

```
#dev
openssl pkcs12 -clcerts -nokeys -out apns_dev_cert.pem -in apns_dev_Certificates.p12
openssl pkcs12 -nocerts -out apns_dev_key.pem -in apns_dev_Certificates.p12

#prod
openssl pkcs12 -clcerts -nokeys -out apns_prod_cert.pem -in apns_prod_Certificates.p12 
openssl pkcs12 -nocerts -out apns_prod_key.pem -in apns_prod_Certificates.p12

# optional to remove passphrase from keys
openssl rsa -in apns_dev_key.pem -out apns_dev_key.unencrypted.pem
openssl rsa -in apns_prod_key.pem -out apns_prod_key.unencrypted.pem
```

Copy the `*.pem` files into the `certs` folder of this repo.


## Setup

Create two [github apps](https://github.com/settings/applications),
one for local development and one for production (you need two because
the callback URL must be pre-registered and match the callback URL
specified during the login flow). These apps are just used to
authenticate the admin for the push dashboard and prevent anyone else
from sending notifications from your server.

```
npm install -d
heroku apps:create <app_name_here>
heroku addons:add mongolab # free 240mg mongo tier
```

## Configure

See config.js for the environment variables you need to set for
running the server. `MONGOLAB_URI` will be provided in your heroku
environment if you ran the above heroku addons command.

### Locally

```
export SITENAME="My push server"
export ADMIN_USERID=<your github userid>
export GH_CONSUMER_KEY=<your github app Client ID>
export GH_CONSUMER_SECRET=<your github app Client Secret>
export GH_CALLBACK=http://localhost:5000/oauth/callback
export EXPRESS_SESSION_SECRET=<random string>
```

Run `mongod` in a terminal

```
cd /path/to/mongodb/bin
./mongod
```

Run PushServer using `foreman` (should start on port 5000)

```
foreman start
```

### Heroku

Create a `production` branch of this repo

```
git branch production
```

Remove `*.pem` from `.gitignore` and add your `certs/*.pem` files to
the branch - this way your certificates will be deployed to heroku.

```
heroku config:set GH_CONSUMER_KEY=<your github app Client ID> \
GH_CONSUMER_SECRET=<your github app Client Secret> \
GH_CALLBACK=http://yourdomain.example.com/oauth/callback \
ADMIN_USERID=<your github userid> \
EXPRESS_SESSION_SECRET=<random string> \
SITENAME="My push server"
```

Push to heroku to deploy

```
git push heroku production:master
```

## Warning

**NEVER** commit your cert/pem files and push them to a public
repo. Make sure to work in a private local branch using your
certs/keys when you push to heroku.

# API

`POST /dev/updateDeviceToken`

Create or update a device token entry in the database, optionally
(un)subscribing it to some channels. The device token is marked in the
database as a sandbox/development environment token.

Parameters
- deviceToken - 64 character string of the iOS device push token (required)
- channels - comma separated string of channels to subscribe to (optional)
- unsubscribe - string "true" if the channels should be unsubscribed instead (optional)

Returns 200 status code on success.

---

`POST /prod/updateDeviceToken`

Create or update a device token entry in the database, optionally
(un)subscribing it to some channels. The device token is marked in the
database as a production environment token.

Parameters
- deviceToken - 64 character string of the iOS device push token (required)
- channels - comma separated string of channels to subscribe to (optional)
- unsubscribe - string "true" if the channels should be unsubscribed instead (optional)

Returns 200 status code on success.

---

`GET /channel_list/:device_token`

Parameters
- :device_token - 64 character string of the iOS device push token (required)

Returns 200 status plain text comma separated list of channels the passed-in device token is
currently subscribed to.

Returns 404 status if device token is not found.

Returns 500 status on other error.

# Dashboard

Navigate to the website root, then click "login with github" in the
upper right to authenticate as the admin. Once logged in, you will see
the "dashboard" link in the nav bar.

On the dashboard page you can select the Dev or Prod environment, the
channel to send a notification to, the badge number (use 0 to clear
the badge), and the message to send in the notification payload.

Hit the "Submit" button, and if all goes well, you will see a
"Success" message on the next page and a push notification arrive on
your device! Errors are logged to the server console.


# LICENSE

MIT License - See LICENSE file for more information

# TODO

See TODO.md for more information
