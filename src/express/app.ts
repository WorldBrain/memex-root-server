const express = require('express')
const cookieParser = require('cookie-parser')
const cookieEncrypter = require('cookie-encrypter')
const cookieSession = require('cookie-session')
const bodyParser = require('body-parser')
import * as passport from 'passport'
import { AppRoutes } from './routes'
import { OAuthStorage } from '../components/storage/modules/oauth'
import { setupOAuthRoutes } from './oauth'

export interface ExpressAppConfig {
  routes : AppRoutes
  passportStrategies : {[name : string] : any}
  cookieSecret : string
  domain : string
  oauthStorage : OAuthStorage
  preConfigure? : Function
  allowUndefinedRoutes? : boolean
}

export default function createApp(config : ExpressAppConfig) {
  // _configurePassport(config.passportStrategies)
  
  const app = express()
  app.use(cookieParser(config.cookieSecret))
  app.use(cookieEncrypter(config.cookieSecret))
  app.use(cookieSession({
    name: 'session',
    secret: config.cookieSecret,
    maxAge: 1000 * 60 * 60 * 24 * 365,
    domain: config.domain,
  }))
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: false }))
  app.use(passport.initialize())
  app.use(passport.session())
  
  config.preConfigure && config.preConfigure(app)
  // setupOAuthRoutes({app, oauthStorage: config.oauthStorage})
  _configureRoutes(app, config.routes, config.allowUndefinedRoutes)
  
  return app
}

export function _configureRoutes(app : any, routes : AppRoutes, allowUndefinedRoutes : boolean) {
  function route(f?) {
    if (!f && allowUndefinedRoutes) {
      f = () => {}
    }
    return (req, res) => f({req, res})
  }

  app.post('/admin/migrate', route(routes.adminStorageMigrate))
  app.post('/auth/register', route(routes.authLocalRegister))
  // app.post('/auth/login', route(routes.authLocalLogin))
  app.post('/auth/passwordless/login/start', route(routes.authPasswordlessLoginStart))
  app.get('/auth/passwordless/login/finish', route(routes.authPasswordlessLoginFinish))
  app.get('/auth/check', route(routes.authLocalCheck))
  app.get('/email/verify', route(routes.authEmailVerify))
  // app.get('/auth/google', route(routes.authGoogleEntry))
  app.get('/auth/google', (req, res) => res.send('BOoo!'))
  app.get('/auth/google/callback', route(routes.authGoogleCallback))
  app.post('/auth/google/refresh', route(routes.authGoogleRefresh))
}

export function _configurePassport(passportStrategies : {[name : string] : any}) {
  passport.serializeUser(function(user, done) {
    try {
      let serialized
      if (user['id']) {
        serialized = `local.id:${user['id']}`
      } else if(user['identifier']) {
        serialized = user['identifier']
      }
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
  for (const [name, strategy] of Object.entries(passportStrategies)) {
    passport.use(name, strategy)
  }
}
