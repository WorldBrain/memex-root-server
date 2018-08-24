import { ExpressReqRes } from '../../types'
import { AppControllers } from '../../../controllers'

export function adminHook(appControllers : AppControllers, hook : 'PostDeploy' | 'PreDeploy') {
  return async function({req, res} : ExpressReqRes) {
    const forbidden = () => res.status(403).send('Forbidden')

    const suppliedAccessCode = req.body.code
    if (req.cookies['mirgrationAccessCode'] !== suppliedAccessCode) {
        return forbidden()
    }

    try {
      const result = await appControllers[`adminHooks${hook}`]({suppliedAccessCode})
      if (!result) {
          return forbidden()
      }

      res.send('OK')
    } catch (err) {
      console.error(err)
      console.error(err.stack)
      res.status(500).send('Failed')
    }
  }
}
