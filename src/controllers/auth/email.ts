import { UserStorage } from '../../components/storage/modules/auth'

export function verify({userStorage} : {userStorage : UserStorage}) {
    return async ({code}) => {
        const {email, identifier} = await userStorage.verifyUserEmail({code})
        const user = userStorage.findByIdentifier(identifier)
        return {user}
    }
}
