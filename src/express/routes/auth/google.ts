import { SESSION_KEYS } from './../../constants';
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
      req.session[SESSION_KEYS['google-refresh-token']] = req.user.refreshToken
      req.session[SESSION_KEYS['last-google-login']] = Date.now()
      delete req.user.refreshToken
      res.json(req.user)
    }

    passport.authenticate('google', { failureRedirect: '/login' })(req, res, next)
  }
}

export function authGoogleRefresh(appControllers : AppControllers) {
  return async function({req, res} : ExpressReqRes) {
    const refreshToken = req.signedCookies.auth.refreshToken
    res.json(await appControllers.authGoogleRefresh({refreshToken}))
  }
}
