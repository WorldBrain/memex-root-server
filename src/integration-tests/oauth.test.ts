import escapeRegExp = require('lodash/fp/escapeRegExp')
import * as request from 'supertest'
import * as expect from 'expect'
import * as passport from 'passport'
import { createSetup, createExpressApp } from '../main'
import { testLoginFlow } from "./auth.test"
import { fixSessionCookie } from './utils'

describe('OAuth integration tests', () => {
    it('should work only for WorldBrain', async () => {
        const worldbrainOAuthCredentials = { id: 'worldbrain-oauth-id', secret: 'worldbrain-oauth-secret' };
        const setup = await createSetup({settings: {
            tier: 'production',
            mailer: 'memory',
            storageBackend: 'memory',
            domain: 'localhost:8000',
            baseUrl: 'http://localhost:8000',
            cookieSecret: 'muahatestingmuahatestingmuahates',
            googleCredentials: {id: 'gid', secret: 'gsec'},
            worldbrainOAuthCredentials
        }})
        const app = createExpressApp(setup)
        const agent = request.agent(app)

        await testLoginFlow({setup, agent})

        const redirectUri = 'https://bla.com/oauth/callback';
        const startResponse = await agent.get('/oauth/start').query({
            client_id: worldbrainOAuthCredentials.id,
            response_type: 'code',
            redirect_uri: redirectUri
        })
        expect(startResponse.redirect).toBe(true)
        expect(startResponse.header.location).toMatch(/^\/oauth\/decision\?transaction_id=.+$/)
        fixSessionCookie(startResponse, agent)

        const codeRedirectRegExp = new RegExp(`^${escapeRegExp(redirectUri)}\\?code=(.+)$`)
        const decisionGetResponse = await agent.get(startResponse.header.location)
        expect(decisionGetResponse.redirect).toBe(true)
        expect(decisionGetResponse.header.location).toMatch(codeRedirectRegExp)
        const code = codeRedirectRegExp.exec(decisionGetResponse.header.location)[1]
        
        const tokenResponse = await request(app).post('/oauth/token').send({
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
            client_id: worldbrainOAuthCredentials.id,
            client_secret: worldbrainOAuthCredentials.secret,
        })
        const accessToken = tokenResponse.body.access_token

        app.get('/api/userinfo',
            passport.authenticate('bearer', { session: false }),
            async function (req, res) {
                const user = await setup.components.storage.users.findById(req.user.userId)
                res.json({identifier: user['identifier']})
            }
        )

        const apiResponse = await request(app).get('/api/userinfo').auth(accessToken, accessToken, {type: 'bearer'})
        expect(apiResponse.body).toEqual({identifier: 'email:something@foo.com'})
    })
})
