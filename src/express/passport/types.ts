export interface ProviderConfiguration {
    id : string
    secret : string
    callbackUrl : string
}

export type ProviderConfigurations = {[name : string] : ProviderConfiguration}