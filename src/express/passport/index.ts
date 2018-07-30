import { UserStorage } from './../../components/storage/modules/auth'
import { ProviderConfigurations } from "./types"
import { createGoogleStrategy } from "./google"
import { createLocalStrategy } from "./local"

export function createPassportStrategies(
    {userStorage, providerConfigurations} :
    {userStorage : UserStorage, providerConfigurations : ProviderConfigurations}
) {
    return [
        createLocalStrategy({userStorage, saltWorkFactor: 10}),
        createGoogleStrategy(providerConfigurations['google']),
    ]
}
