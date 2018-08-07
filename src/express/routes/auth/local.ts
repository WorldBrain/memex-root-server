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
    passport.authenticate('local', function(err, user, info) {
      if (err) {
        return res.json({ success: false, error: 'internal' })
      }
      if (!user) {
        return res.json({ success: false, error: 'invalid-credentials' })
      }

      req.logIn(user, function(err) {
        if (err) {
          return res.json({ success: false, error: 'internal-error-login' })
        }
        return res.json({ success: true })
      })
    })(req, res, next)
  }
}

export function authLocalCheck(appControllers : AppControllers) {
  return async function({req, res} : ExpressReqRes) {
    res.json({authenticated: req.user ? !!req.user.id : false})
  }
}
