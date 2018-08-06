import * as passport from 'passport'
import { ExpressReqRes } from '../../types'
import { AppControllers } from '../../../controllers'

export function authLocalRegister(appControllers : AppControllers) {
  return async function({req, res} : ExpressReqRes) {
    console.log('inside route')
    const { error } = await appControllers.authLocalRegister({email: req.body.email, password: req.body.password})
    res.json({success: !error, error: error || null})
    console.log('leaving route')
  }
}

export function authLocalLogin(appControllers : AppControllers) {
  return async function({req, res, next} : ExpressReqRes) {
    // TODO: Rate-limit this route

    passport.authenticate('local', <any>{
        session: false,
    })(req, res, next)
  }
}

export function authLocalCheck(appControllers : AppControllers) {
  return async function({req, res} : ExpressReqRes) {
    res.json({authenticated: !!req.user.id})
  }
}
