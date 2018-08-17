import { ExpressReqRes } from '../../types'
import { AppControllers } from '../../../controllers'

export function adminStorageMigrate(appControllers : AppControllers) {
  return async function({req, res} : ExpressReqRes) {
    const forbidden = () => res.status(401).send('Forbidden')

    const suppliedAccessCode = req.query.code
    if (req.cookies['mirgrationAccessCode'] !== suppliedAccessCode) {
        return forbidden()
    }

    const result = await appControllers.adminStorageMigrate({suppliedAccessCode})
    if (!result) {
        return forbidden()
    }

    res.send('OK')
  }
}
