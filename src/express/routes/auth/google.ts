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
    const next = async () => {
      console.log(req.user)
      const {encryptedRefreshToken} = await appControllers.authGoogleCallback({receivedRefreshToken: req.user.refreshToken})
      console.log(req.user.refreshToken, encryptedRefreshToken)
      req.user.refreshToken = encryptedRefreshToken
      res.json(req.user)
    }

    passport.authenticate('google', { failureRedirect: '/login' })(req, res, next)
  }
}

export function authGoogleRefresh(appControllers : AppControllers) {
  return async function({req, res} : ExpressReqRes) {
    const encryptedRefreshToken = req.body.refreshToken
    res.json(await appControllers.authGoogleRefresh({encryptedRefreshToken}))
  }
}
