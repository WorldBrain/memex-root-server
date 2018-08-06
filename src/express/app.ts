const express = require('express')
const cookieSession = require('cookie-session')
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
    if (user['id']) {
      done(null, `local.id:${user['id']}`)
    } else if(user['identifier']) {
      done(null, user['identifier'])

    }
  })
  
  passport.deserializeUser((identifier : string, done) => {
    const [provider, id] = identifier.split(':')
    if (provider === 'local.id') {
      done(null, {id})
    } else if(provider === 'google') {
      done(null, {identifier})
    } else {
      done(new Error('Invalid serialized user found in session'))
    }
  })
  passportStrategies.forEach(strategy => {
    passport.use(strategy)
  })

  const app = express()
  // app.use(cookieParser(cookieSecret))
  // app.use(cookieEncrypter(cookieSecret))
  app.use(cookieSession({
    name: 'session',
    secret: cookieSecret,
    maxAge: 1000 * 60 * 60 * 24 * 365,
  }))
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
  app.post('/auth/register', route(routes.authLocalRegister))
  app.post('/auth/login', route(routes.authLocalLogin))
  app.get('/auth/check', route(routes.authLocalCheck))
  app.get('/email/verify', route(routes.authEmailVerify))
  app.get('/auth/google', route(routes.authGoogleEntry))
  app.get('/auth/google/callback', route(routes.authGoogleCallback))
  app.post('/auth/google/refresh', route(routes.authGoogleRefresh))
  return app
}
