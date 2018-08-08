import { SESSION_KEYS } from '../../constants';
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
      res.cookie('auth.google', {
        [SESSION_KEYS['google-refresh-token']]: req.user.refreshToken,
        [SESSION_KEYS['last-google-login']]: Date.now()
      }, {
        signed: true,
        maxAge: 1000 * 60 * 60 * 24 * 365,
        path: '/auth/google'
      })

      delete req.user.refreshToken
      res.json(req.user)
    }

    passport.authenticate('google', { failureRedirect: '/login' })(req, res, next)
  }
}

export function authGoogleRefresh(appControllers : AppControllers) {
  return async function({req, res} : ExpressReqRes) {
    const refreshToken = req.signedCookies['auth.google'].refreshToken
    res.cookie('auth.google', req.signedCookies['auth.google'], {
      signed: true,
      maxAge: 1000 * 60 * 60 * 24 * 365,
      path: '/auth/google'
    })
    res.json(await appControllers.authGoogleRefresh({refreshToken}))
  }
}
