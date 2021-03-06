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

const createServer = async (
	{suppliedAdminAccessCode, tierOverwrite} : {suppliedAdminAccessCode? : string, tierOverwrite? : string} = {}
) => {
	console.log('creating setup')
	const setup = await main.createSetup({suppliedAdminAccessCode, overwrites: {tier: tierOverwrite}})
	console.log('creating app')
	const app = main.createExpressApp(setup)
	console.log('creating proxy server')
	return awsServerlessExpress.createServer(app, null, BINARY_MIME_TYPES)
}

const defaultServer = (async () => {
	return await createServer()
})()

exports.handler = async (event, context) => {
	console.log('executing handler')

	let suppliedAdminAccessCode : string, tierOverwrite : string
	if (event.queryStringParameters !== null && event.queryStringParameters !== undefined) {
		tierOverwrite = event.queryStringParameters['tier']
		suppliedAdminAccessCode = event.queryStringParameters['access-code']
	}

	let server
	try {
		if (tierOverwrite) {
			server = await defaultServer
		} else {
			server = await createServer({tierOverwrite, suppliedAdminAccessCode})
		}
	} catch (err) {
		console.error(err)
		console.error(err.stack)
		return { statusCode: 500, body: 'Error during initialization' }
	}
	
	console.log('proxing request')
	return new Promise((resolve, reject) => {
		awsServerlessExpress.proxy(server, event, {
			...context,
			succeed: context.succeed,
		})
	})
}

// (async () => {
// const succeed = params => {
// 	console.log('success', params)
// }

// console.log('handler', await exports.handler(
// 	{ // event
// 		"resource":"/{proxy+}",
// 		"path":"/auth/google",
// 		"httpMethod":"GET",
// 		"headers":{
// 			"Accept":"*/*","CloudFront-Forwarded-Proto":"https",
// 			"CloudFront-Is-Desktop-Viewer":"true","CloudFront-Is-Mobile-Viewer":"false","CloudFront-Is-SmartTV-Viewer":"false",
// 			"CloudFront-Is-Tablet-Viewer":"false","CloudFront-Viewer-Country":"IT","Host":"c30qypeazc.execute-api.eu-central-1.amazonaws.com",
// 			"User-Agent":"curl/7.55.1","Via":"1.1 785863fe1b0961dc0a54153752ab0c4c.cloudfront.net (CloudFront)",
// 			"X-Amz-Cf-Id":"l4pAiiX8hVZPq3o6_0yT74L5sB7M4bBSHdBOWIAMUXR9G90S_QtFyw==",
// 			"X-Amzn-Trace-Id":"Root=1-5b7a817f-68cb1a16aa150e50c1575e04",
// 			"X-Forwarded-For":"151.35.85.87, 70.132.17.122","X-Forwarded-Port":"443","X-Forwarded-Proto":"https"},
// 			"queryStringParameters":null,"pathParameters":{"proxy":"auth/google"},
// 			"stageVariables":null,
// 	},
// 	{ // context
// 		succeed,
// 		"resourceId":"0w8z2d","resourcePath":"/{proxy+}","httpMethod":"GET","extendedRequestId":"L6kr2EY2liAFmBg=","requestTime":"20/Aug/2018:08:53:19 +0000",
// 	}
// ))
// })()
