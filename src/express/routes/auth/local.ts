import * as passport from 'passport'
import { ExpressReqRes } from '../../types'
import { AppControllers } from '../../../controllers'

export function authLocalRegister(appControllers : AppControllers) {
  return async function({req, res} : ExpressReqRes) {
    const { error } = await appControllers.authLocalRegister({email: req.body.email, password: req.body.password})
    res.json({success: !error, error: error || null})
  }
}

export function authLocalLogin(appControllers : AppControllers) {
  return async function({req, res, next} : ExpressReqRes) {
    passport.authenticate('local', <any>{
        session: false,
    })(req, res, next)
  }
}

export function authLocalCheck(appControllers : AppControllers) {
  return async function({req, res} : ExpressReqRes) {
    res.json({authenticated: req.user ? !!req.user.id : false})
  }
}
