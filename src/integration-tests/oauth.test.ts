import escapeRegExp = require('lodash/fp/escapeRegExp')
import * as request from 'supertest'
import * as expect from 'expect'
import * as passport from 'passport'
import { createSetup, createExpressApp } from '../main'
import { testLoginFlow } from "./auth.test"
import { fixSessionCookie } from './utils'
import { createWorldbrainOAuthClient } from '../components/storage/modules/oauth';

describe('OAuth integration tests', () => {
    it('should work for WorldBrain', async () => {
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
        await createWorldbrainOAuthClient(setup.components.storage.oauth, worldbrainOAuthCredentials, undefined)

        const app = createExpressApp(setup)
        const agent = request.agent(app)

        const {user} = await testLoginFlow({setup, agent})

        await testOAuthFlow({setup, agent, app, user, clientCredentials: worldbrainOAuthCredentials})
    })

    it('should work for WorldBrain also when done more than once', async () => {
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
        await createWorldbrainOAuthClient(setup.components.storage.oauth, worldbrainOAuthCredentials, undefined)

        const app = createExpressApp(setup)
        const agent = request.agent(app)

        const {user} = await testLoginFlow({setup, agent})

        await testOAuthFlow({setup, agent, app, user, clientCredentials: worldbrainOAuthCredentials})
        await testOAuthFlow({setup, agent, app, user, clientCredentials: worldbrainOAuthCredentials})
    })
})

async function testOAuthFlow({setup, agent, user, app, clientCredentials}) {
    const redirectUri = 'https://bla.com/oauth/callback';
    const startResponse = await agent.get('/oauth/start').query({
        client_id: clientCredentials.id,
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
        client_id: clientCredentials.id,
        client_secret: clientCredentials.secret,
    })
    const accessToken = tokenResponse.body.access_token
    // console.log(tokenResponse.body)

    const profileResponse = await request(app).get('/oauth/profile').auth(accessToken, accessToken, {type: 'bearer'})
    expect(profileResponse.body).toEqual({id: user.id, email: 'something@foo.com'})

    const linkResponse = await request(app)
        .post('/oauth/wp-link')
        .auth(accessToken, accessToken, {type: 'bearer'})
        .send({
            user_id: '666',
        })
    expect(linkResponse.text).toEqual('OK')

    expect(await setup.components.storage.wpLinks.getWordpressId({user: user.id})).toEqual('666')
}
