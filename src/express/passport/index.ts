import { ProviderConfiguration } from "./types"
import { createGoogleStrategy } from "./google"

export function createPassportStrategies(providerConfigurations : {[name : string] : ProviderConfiguration}) {
    return [createGoogleStrategy(providerConfigurations['google'])]
}
