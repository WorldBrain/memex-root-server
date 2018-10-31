import { ExpressReqRes } from "../types"
import { AppControllers } from "../../controllers"

export function subscriptionsCheckAutomaticBackup(appControllers : AppControllers) {
    return async function({req, res} : ExpressReqRes) {
        res.json(await appControllers.subscriptionsCheckAutomaticBackup({
            userId: req.query.user
        }))
    }
}
