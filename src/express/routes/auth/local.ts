import * as passport from 'passport'
import { ExpressReqRes } from '../../types'
import { AppControllers } from '../../../controllers'

export function authLocalRegister(appControllers : AppControllers) {
  return async function({req, res} : ExpressReqRes) {
    
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
    
  }
}
