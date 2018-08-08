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
    googleCredentials?: { id : string, secret : string }
    cookieSecret: string
    devOptions?: DevShortcutsConfig
}

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
    const tierFromEnv = process.env.TIER
    if (tierFromEnv === 'development' || tierFromEnv === 'staging' || tierFromEnv === 'production') {
        return tierFromEnv
    }
    throw new Error('Misconfiguration, unknown deployment tier: ' + tierFromEnv)
}

export function getDomain({tier}) {
    if (tier === 'development') {
        return 'localhost:3002'
    } else if (tier === 'staging') {
        return 'staging.memex.cloud'
    } else {
        return 'memex.cloud'
    }
}

export function getOrigin({tier}) {
    const domain = getDomain({tier})
    return tier === 'development' ? `http://${domain}` : `https://${domain}`
}

export function getBaseUrl({tier}) {
    return getOrigin({tier})
}

export function getGoogleCredentials() {
    return { id: process.env.GOOGLE_CLIENT_ID, secret: process.env.GOOGLE_CLIENT_SECRET }
}

export function getCookieSecret({tier}) {
    let secret = process.env.COOKIE_SECRET
    if (!secret) {
        if (tier === 'development') {
            secret = 'notsosecret|ReDrUm!!|notsosecret'
        } else {
            throw new Error('Tried to run this with providing a COOKIE_SECRET. Exploding for your safety  <3')
        }
    }
    return secret
}

export function getAwsSesRegion() {
    return process.env.AWS_SES_REGION || 'us-east-1'
}

export function getSettings() : Settings {
    const tier = getDeploymentTier()
    return {
        tier,
        awsSesRegion: getAwsSesRegion(),
        domain: getDomain({tier}),
        baseUrl: getBaseUrl({tier}),
        googleCredentials: getGoogleCredentials(),
        cookieSecret: getCookieSecret({tier}),
        devOptions: parseCommandLineOptions().dev,
    }
}
