import { UserStorage } from '../../components/storage/modules/auth'

export function verify({userStorage} : {userStorage : UserStorage}) {
    return async ({code}) => {
        const result = await userStorage.verifyUserEmail({code})
        if (!result) {
            return null
        }
        const user = await userStorage.findByIdentifier(result.identifier)
        return {user}
    }
}
