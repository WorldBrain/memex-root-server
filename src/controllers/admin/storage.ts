import { Storage } from '../../components/storage'
import { securelyValidateAdminAccessCode } from '../../utils/admin';

export function migrate({storage, accessCode} : {storage : Storage, accessCode : string}) {
    return async ({suppliedAccessCode} : {suppliedAccessCode : string}) => {
        if (!await securelyValidateAdminAccessCode({accessCode, suppliedAccessCode})) {
            return false
        }
        await storage._mananger.backend.migrate()
        return true
    }
}
