import { Storage } from '../../components/storage'

export function migrate({storage, accessCode} : {storage : Storage, accessCode : string}) {
    return async ({suppliedAccessCode} : {suppliedAccessCode : string}) => {
        if (!accessCode || !accessCode.trim()) {
            return false
        }
        if (suppliedAccessCode !== accessCode) {
            return false
        }
        await storage._mananger.backend.migrate()
        return true
    }
}
