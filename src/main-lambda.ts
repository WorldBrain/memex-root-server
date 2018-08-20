import * as awsServerlessExpress from 'aws-serverless-express'
import * as main from './main'

const BINARY_MIME_TYPES = [
	'application/octet-stream',
	'font/eot',
	'font/opentype',
	'font/otf',
	'image/jpeg',
	'image/png',
	'image/svg+xml'
]

exports.handler = async (event, context) => {
	let suppliedAdminAccessCode : string, tierOverwrite : string
	if (event.queryStringParameters !== null && event.queryStringParameters !== undefined) {
		tierOverwrite = event.queryStringParameters['tier']
		suppliedAdminAccessCode = event.queryStringParameters['access-code']
	}

	const setup = await main.createSetup({overwrites: {tierOverwrite}, suppliedAdminAccessCode})
    const app = main.createExpressApp(setup)
	const server = awsServerlessExpress.createServer(app, null, BINARY_MIME_TYPES)
	return awsServerlessExpress.proxy(server, event, context)
}
