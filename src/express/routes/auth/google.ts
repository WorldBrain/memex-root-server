import * as passport from 'passport'
import { ExpressReqRes } from '../../types'
import { AppControllers } from '../../../controllers'

export function authGoogleEntry(appControllers : AppControllers) {
  return async function({req, res, next} : ExpressReqRes) {
    let scope : string[] = req.query.scope
    if (!(scope instanceof Array)) {
        scope = [scope]
    }
    scope.push('https://www.googleapis.com/auth/plus.login')

    passport.authenticate('google', <any>{
      session: false,
      includeGrantedScopes: true,
      accessType: 'offline',
      scope,
      approvalPrompt: 'force',
    })(req, res, next)
  }
}

export function authGoogleCallback(appControllers : AppControllers) {
  return async function({req, res} : ExpressReqRes) {
    const next = () => {
      res.cookie('auth', {
        start: Date.now(),
        refreshToken: req.user.refreshToken
      }, {
        signed: true,
        maxAge: 1000 * 60 * 60 * 24 * 365,
      })
      delete req.user.refreshToken
      res.json(req.user)
    }

    passport.authenticate('google', { failureRedirect: '/login' })(req, res, next)
  }
}

export function authGoogleRefresh(appControllers : AppControllers) {
  return async function({req, res} : ExpressReqRes) {
    const refreshToken = req.signedCookies.auth.refreshToken
    res.cookie('auth', {
      start: req.signedCookies.start,
      refreshToken
    }, {
      signed: true,
      maxAge: 1000 * 60 * 60 * 24 * 365,
    })
    res.json(await appControllers.authGoogleRefresh({refreshToken}))
  }
}
