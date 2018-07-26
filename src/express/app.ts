const express = require('express')
const cookieParser = require('cookie-parser')
const cookieEncrypter = require('cookie-encrypter')
const bodyParser = require('body-parser')
import * as passport from 'passport'
import { AppRoutes } from './routes'

export default function createApp(
  {routes, preConfigure, passportStrategies, cookieSecret, allowUndefinedRoutes = false} :
  {routes : AppRoutes, preConfigure? : Function, passportStrategies : any[], cookieSecret : string, allowUndefinedRoutes? : boolean}
) {
  function route(f?) {
    if (!f && allowUndefinedRoutes) {
      f = () => {}
    }
    return (req, res) => f({req, res})
  }

  passport.serializeUser(function(user, done) {
    done(null, 'none');
  });
  
  passport.deserializeUser(function(id, done) {
    done(null, id);
  })
  passportStrategies.forEach(strategy => {
    passport.use(strategy)
  })

  const app = express()
  app.use(cookieParser(cookieSecret))
  app.use(cookieEncrypter(cookieSecret))
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: false }))
  app.use(passport.initialize())
  // app.use((req, res, next) => {
  //   const origin = req.get('Origin')
  //   if (origin === 'http://memex.link' || origin === 'http://staging.memex.link') {
  //     res.header("Access-Control-Allow-Origin", origin)
  //   }
  //   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
  //   res.header("Access-Control-Allow-Credentials", "true")
  //   res.header("Access-Control-Allow-Methods", "POST")
  //   next()
  // })
  preConfigure && preConfigure(app)
  app.get('/auth/google', route(routes.authGoogleEntry))
  app.get('/auth/google/callback', route(routes.authGoogleCallback))
  app.post('/auth/google/refresh', route(routes.authGoogleRefresh))
  return app
}
