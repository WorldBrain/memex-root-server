const _ = require('lodash')
import * as yargs from 'yargs'
import { DevShortcutCommand, DevShortcutsConfig } from './dev-shortcuts/types'

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

export function getDeploymentTier() {
    return process.env.TIER || 'development'
}

export function getDomain({tier}) {
    return tier === 'production' ? 'https://memex.cloud' : 'https://staging.memex.cloud'
}

export function getBaseUrl({tier}) {
    return tier === 'development' ? 'http://localhost:3002' : getDomain({tier})
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

export function getSettings() {
    const tier = getDeploymentTier()
    return {
        tier,
        baseUrl: getBaseUrl({tier}),
        googleCredentials: getGoogleCredentials(),
        cookieSecret: getCookieSecret({tier}),
        devOptions: parseCommandLineOptions().dev,
    }
}
