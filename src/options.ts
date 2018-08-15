const _ = require('lodash')
import * as yargs from 'yargs'
import { DevShortcutCommand, DevShortcutsConfig } from './dev-shortcuts/types'

export type DeploymentTier = 'development' | 'staging' | 'production'
export interface Settings {
    tier : DeploymentTier,
    awsSesRegion?: string
    mailer?: 'ses' | 'fs' | 'memory'
    storageBackend? : 'aws' | 'memory'
    domain: string
    baseUrl: string
    migrationAccessCode? : string
    googleCredentials?: { id : string, secret : string }
    worldbrainOAuthCredentials? : { id : string, secret : string }
    cookieSecret: string
    devOptions?: DevShortcutsConfig
}

const missingEnvVar = (name : string) => new Error(`Tried to run this without providing a ${name}. Exploding for your safety  <3`)

export function parseCommandLineOptions() {
    const options = yargs
        .array('dev')
        .parse()
    
    options.dev = <DevShortcutsConfig>(options.dev || []).map(configString => {
        const [name, ...optionsParts] = configString.split(':')
        const optionsString = optionsParts.join(':')
        
        let options = {}
        if (optionsString) {
            const optionStrings = optionsString.split(',')
            const optionPairs = optionStrings.map(optionString => optionString.split('='))
            options = _.fromPairs(optionPairs)
        }
        return <DevShortcutCommand>{name, options}
    })

    return options
}

export function getDeploymentTier() : DeploymentTier {
    if (process.env.NODE_ENV === 'dev') {
        return 'development'
    }

    const tierFromEnv = process.env.TIER
    if (tierFromEnv === 'staging' || tierFromEnv === 'production') {
        return tierFromEnv
    }
    throw new Error('Misconfiguration, unknown deployment tier: ' + tierFromEnv)
}

export function getDomain({tier} : {tier : DeploymentTier}) {
    if (tier === 'development') {
        return 'localhost:3002'
    } else if (tier === 'staging') {
        return 'staging.memex.cloud'
    } else {
        return 'memex.cloud'
    }
}

export function getOrigin({tier} : {tier : DeploymentTier}) {
    const domain = getDomain({tier})
    return tier === 'development' ? `http://${domain}` : `https://${domain}`
}

export function getBaseUrl({tier} : {tier : DeploymentTier}) {
    return getOrigin({tier})
}

export function getGoogleCredentials() {
    return { id: process.env.GOOGLE_CLIENT_ID, secret: process.env.GOOGLE_CLIENT_SECRET }
}

export function getCookieSecret({tier} : {tier : DeploymentTier}) {
    let secret = process.env.COOKIE_SECRET
    if (!secret) {
        if (tier === 'development') {
            secret = 'notsosecret|ReDrUm!!|notsosecret'
        } else {
            throw missingEnvVar('COOKIE_SECRET')
        }
    }
    return secret
}

export function getAwsSesRegion() {
    return process.env.AWS_SES_REGION || 'us-east-1'
}

export function getStorageBackend({tier} : {tier : DeploymentTier}) {
    if (tier === 'development') {
        return 'memory'
    }

    return 'aws'
}

export function getWorldbrainOAuthCredentials() {
    return {
        id: process.env.WORLDBRAIN_WP_CLIENT_ID,
        secret: process.env.WORLDBRAIN_WP_CLIENT_SECRET,
    }
}

export function getMigrationAccessCode({tier}) {
    const code = process.env.MIGRATION_ACCESS_CODE
    if (!code && tier !== 'development') {
        throw missingEnvVar('MIGRATION_ACCESS_CODE')
    }
    return code
}

export function getSettings() : Settings {
    const tier = getDeploymentTier()
    return {
        tier,
        awsSesRegion: getAwsSesRegion(),
        storageBackend: getStorageBackend({tier}),
        domain: getDomain({tier}),
        baseUrl: getBaseUrl({tier}),
        googleCredentials: getGoogleCredentials(),
        worldbrainOAuthCredentials: getWorldbrainOAuthCredentials(),
        migrationAccessCode: getMigrationAccessCode({tier}),
        cookieSecret: getCookieSecret({tier}),
        devOptions: parseCommandLineOptions().dev,
    }
}
