import { UserStorage } from './../../components/storage/modules/auth'
import { PasswordHasher } from '../../components/password-hasher';
import { ProviderConfigurations } from "./types"
import { createGoogleStrategy } from "./google"
import { createLocalStrategy } from "./local"

export function createPassportStrategies(
    {userStorage, providerConfigurations, passwordHasher} :
    {userStorage : UserStorage, providerConfigurations : ProviderConfigurations, passwordHasher: PasswordHasher}
) {
    return [
        createLocalStrategy({userStorage, passwordHasher}),
        createGoogleStrategy(providerConfigurations['google']),
    ]
}
