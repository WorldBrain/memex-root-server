import { ExpressReqRes } from '../../types'
import { AppControllers } from '../../../controllers'

export function authEmailVerifiy(appControllers : AppControllers) {
  return async function({req, res} : ExpressReqRes) {
    const { user } = await appControllers.authEmailVerify({code: req.query.code})
    await new Promise((resolve, reject) => {
      try {
        req.login(user, err => err ? reject(err) : resolve())
      } catch(err) {
        reject(err)
      }
    })
    res.json({ status: 'OK' })
  }
}
