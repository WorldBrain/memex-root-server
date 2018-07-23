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

export function getSettings() {
    const { dev: devOptions } = parseCommandLineOptions()
    const tier = getDeploymentTier()
    const baseUrl = getBaseUrl({tier})
    const googleCredentials = getGoogleCredentials()
    return { devOptions, tier, baseUrl, googleCredentials }
}
