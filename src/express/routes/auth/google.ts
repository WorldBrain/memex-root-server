import * as passport from 'passport'
import { ExpressReqRes } from '../../types'
import { AppControllers } from '../../../controllers'

export function authGoogleEntry(appControllers : AppControllers) {
  return async function({req, res, next} : ExpressReqRes) {
    passport.authenticate('google', {scope: []})(req, res, next)
  }
}

export function authGoogleCallback(appControllers : AppControllers) {
  return async function({req, res} : ExpressReqRes) {
    const next = () => {
        res.send() // send access and refresh token here
    }

    passport.authenticate('google', { failureRedirect: '/login' })(req, res, next)
  }
}

export function authGoogleRefresh(appControllers : AppControllers) {
  return async function({req, res} : ExpressReqRes) {
    
  }
}
