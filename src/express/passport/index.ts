import { UserStorage } from '../../components/storage/modules/auth'
import { PasswordHasher } from '../../components/password-hasher';
import { PasswordlessTokenStorage } from '../../components/storage/modules/passwordless';
import { ProviderConfigurations } from "./types"
import { createGoogleStrategy } from "./google"
import { createLocalStrategy } from "./local"
import { createPasswordlessStrategy } from './passwordless';

export function createPassportStrategies(
    {userStorage, passwordlessTokenStorage, providerConfigurations, passwordHasher} :
    {userStorage : UserStorage, passwordlessTokenStorage : PasswordlessTokenStorage, providerConfigurations : ProviderConfigurations, passwordHasher: PasswordHasher}
) {
    return {
        local: createLocalStrategy({userStorage, passwordHasher}),
        google: createGoogleStrategy(providerConfigurations['google']),
        passwordless: createPasswordlessStrategy({passwordlessTokenStorage, userStorage}),
    }
}
