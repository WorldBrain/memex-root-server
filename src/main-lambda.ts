import * as awsServerlessExpress from 'aws-serverless-express'
import setupApp from './main-claudia'

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
	const app = await setupApp()
	const server = awsServerlessExpress.createServer(app, null, BINARY_MIME_TYPES)
	return await awsServerlessExpress.proxy(server, event, context)
}
