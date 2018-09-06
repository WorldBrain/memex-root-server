import { ExpressReqRes } from "../../types"
import { AppControllers } from "../../../controllers"

export function loginStart(appControllers: AppControllers) {
  return async function ({ req, res }: ExpressReqRes) {
    const { success, error } = await appControllers.authPasswordlessGenerateToken({ email: req.body.email })
    const responseType = req.query.responseType || 'redirect'
    
    if (responseType === 'redirect') {
      const urls = {success: req.body.successUrl, fail: req.body.failureUrl}
      const url = success ? urls.success : urls.fail
      res.redirect(url)
    } else {
      res.json({success, error})
    }
  }
}
