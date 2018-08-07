const express = require('express')
const cookieParser = require('cookie-parser')
const cookieSession = require('cookie-session')
const bodyParser = require('body-parser')
import * as passport from 'passport'
import { AppRoutes } from './routes'

export default function createApp(
  {routes, preConfigure, passportStrategies, cookieSecret, allowUndefinedRoutes = false} :
  {routes : AppRoutes, preConfigure? : Function, passportStrategies : any[], cookieSecret : string, allowUndefinedRoutes? : boolean}
) {
  _configurePassport(passportStrategies)
  
  const app = express()
  // app.use(cookieParser())
  app.use(cookieSession({
    name: 'session',
    secret: cookieSecret,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 365,
    },
    signed: true
  }))
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: false }))
  app.use(passport.initialize())
  app.use(passport.session())

  preConfigure && preConfigure(app)
  _configureRoutes(app, routes, allowUndefinedRoutes)
  
  return app
}

export function _configureRoutes(app : any, routes : AppRoutes, allowUndefinedRoutes : boolean) {
  function route(f?) {
    if (!f && allowUndefinedRoutes) {
      f = () => {}
    }
    return (req, res) => f({req, res})
  }

  app.post('/auth/register', route(routes.authLocalRegister))
  app.post('/auth/login', route(routes.authLocalLogin))
  app.get('/auth/check', route(routes.authLocalCheck))
  app.get('/email/verify', route(routes.authEmailVerify))
  app.get('/auth/google', route(routes.authGoogleEntry))
  app.get('/auth/google/callback', route(routes.authGoogleCallback))
  app.post('/auth/google/refresh', route(routes.authGoogleRefresh))
}

export function _configurePassport(passportStrategies : any[]) {
  passport.serializeUser(function(user, done) {
    try {
      let serialized
      if (user['id']) {
        serialized = `local.id:${user['id']}`
      } else if(user['identifier']) {
        serialized = user['identifier']
      }
      console.log('serialized', serialized)
      done(null, serialized)
    } catch(err) {
      done(err)
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
}
