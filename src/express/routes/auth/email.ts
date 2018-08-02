import { ExpressReqRes } from '../../types'
import { AppControllers } from '../../../controllers'

export function authEmailVerifiy(appControllers : AppControllers) {
  return async function({req, res} : ExpressReqRes) {
    const { user } = await appControllers.authEmailVerify({code: req.params.code})
    await new Promise((resolve, reject) => req.login(user, err => err ? reject(err) : resolve()))
    res.json({ status: 'OK' })
  }
}
