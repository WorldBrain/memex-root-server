import { ExpressReqRes } from "../../types"
import { AppControllers } from "../../../controllers"

export function loginStart(appControllers: AppControllers) {
  return async function ({ req, res }: ExpressReqRes) {
    const { success } = await appControllers.authPasswordlessGenerateToken({ email: req.body.email })
    
    const urls = {success: req.body.successUrl, fail: req.body.failureUrl}
    if (success) {
        res.redirect(urls.success)
    } else {
        res.redirect(urls.fail)
    }
  }
}
