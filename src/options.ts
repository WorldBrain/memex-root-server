const _ = require('lodash')
import * as yargs from 'yargs'
import { DevShortcutCommand, DevShortcutsConfig } from './dev-shortcuts/types'

export type DeploymentTier = 'development' | 'staging' | 'production'
export type DatabaseCredentials = { host: string, port : number, username : string, password : string }
export type AwsSesSettings = {region : string, key : string, secret : string}
export interface Settings {
    tier : DeploymentTier,
    awsSesSettings?: AwsSesSettings
    mailer?: 'ses' | 'fs' | 'memory'
    storageBackend? : 'aws' | 'memory'
    domain: string
    baseUrl: string
    adminAccessCode? : string
    databaseCredentials? : DatabaseCredentials
    googleCredentials?: { id : string, secret : string }
    wooCommerceCredentials? : { id : string, secret : string }
    worldbrainOAuthCredentials? : { id : string, secret : string }
    cookieSecret: string
    devOptions?: DevShortcutsConfig
}

const missingEnvVar = (name : string) => new Error(`Tried to run this without providing a ${name}. Exploding for your safety  <3`)
const requiredEnvVar = (name : string, tier : string) => {
    const value = process.env[name]
    if (!value && tier !== 'development') {
        throw missingEnvVar(name)
    }
    return value
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

export function getGoogleCredentials({tier} : {tier : DeploymentTier}) {
    return {
        id: requiredEnvVar('GOOGLE_CLIENT_ID', tier),
        secret: requiredEnvVar('GOOGLE_CLIENT_SECRET', tier)
    }
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

export function getAwsSesSettings() : AwsSesSettings {
    return {
        region: process.env.AWS_SES_REGION || 'us-east-1',
        key: process.env.AWS_SES_KEY,
        secret: process.env.AWS_SES_SECRET,
    }
}

export function getStorageBackend({tier} : {tier : DeploymentTier}) {
    if (tier === 'development') {
        return 'memory'
    }

    return 'aws'
}

export function getWorldbrainOAuthCredentials({tier} : {tier : DeploymentTier}) {
    return {
        id: requiredEnvVar('WORLDBRAIN_WP_CLIENT_ID', tier),
        secret: requiredEnvVar('WORLDBRAIN_WP_CLIENT_SECRET', tier),
    }
}

export function getAdminAccessCode({tier} : {tier : DeploymentTier}) {
    return requiredEnvVar('ADMIN_ACCESS_CODE', tier)
}

export function getRdsCredentials({tier} : {tier : DeploymentTier}) {
    const username = requiredEnvVar('RDS_USERNAME', tier)
    const password = requiredEnvVar('RDS_PASSWORD', tier)
    return {host: 'memex-cloud.cq6sab3rf0cl.eu-central-1.rds.amazonaws.com', port: 5432, username, password}
}

export function getWooCommerceCredentials({tier} : {tier : DeploymentTier}) {
    if (!process.env.WOOCOMMERCE_CLIENT_ID) {
        return null
    }

    return {
        id: requiredEnvVar('WOOCOMMERCE_CLIENT_ID', tier),
        secret: requiredEnvVar('WOOCOMMERCE_CLIENT_SECRET', tier),
    }
}

export function getSettings({overwrites, suppliedAdminAccessCode} : {overwrites?, suppliedAdminAccessCode? : string} = {}) : Settings {
    let tier = getDeploymentTier()

    const adminAccessCode = getAdminAccessCode({ tier })
    if (overwrites && overwrites.tier && suppliedAdminAccessCode === adminAccessCode) {
        tier = overwrites.tier
    }

    return {
        tier,
        awsSesSettings: getAwsSesSettings(),
        storageBackend: getStorageBackend({tier}),
        domain: getDomain({tier}),
        baseUrl: getBaseUrl({tier}),
        googleCredentials: getGoogleCredentials({tier}),
        wooCommerceCredentials: getWooCommerceCredentials({tier}),
        worldbrainOAuthCredentials: getWorldbrainOAuthCredentials({tier}),
        adminAccessCode: adminAccessCode,
        databaseCredentials: getRdsCredentials({tier}),
        cookieSecret: getCookieSecret({tier}),
        devOptions: parseCommandLineOptions().dev,
    }
}
