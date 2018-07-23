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

export function shouldUseAws({tier}) {
    if (tier === 'development') {
        // In development, use AWS backend only if requested explicitly through the AWS_REGION env var
        return !!process.env.AWS_REGION
    }

    return true
}

export function shouldUseAwsForTests() {
    return shouldUseAws({tier: getDeploymentTier()})
}

export function getUnitTestAwsBucket() {
    return 'unittest.memex.link'
}

export function getDeploymentTier() {
    return process.env.TIER || 'development'
}

export function getAwsBucketName({tier}) {
    if (tier === 'development') {
        return shouldUseAws({tier}) ? 'staging.memex.link' : null
    }
    return tier === 'production' ? process.env.PRODUCTION_BUCKET : process.env.STAGING_BUCKET
}

export function getBaseUrl({tier, awsBucket}) {
    const bucketUrl = awsBucket && `http://${awsBucket}`
    return tier === 'development' ? bucketUrl || 'http://localhost:3000' : bucketUrl
}

export function getSettings() {
    const { dev: devOptions } = parseCommandLineOptions()
    const tier = getDeploymentTier()
    const awsBucket = getAwsBucketName({tier})
    const baseUrl = getBaseUrl({tier, awsBucket})
    return { devOptions, tier, awsBucket, baseUrl }
}
