import * as request from 'supertest'
import * as expect from 'expect'
import { createSetup, createExpressApp } from '../main'
import { fixSessionCookie } from './utils'

describe('Auth service integration tests', () => {
    it('should handle the signup flow correctly', async () => {
        const setup = await createSetup({
            tier: 'production',
            mailer: 'memory',
            storageBackend: 'memory',
            domain: 'localhost:8000',
            baseUrl: 'http://localhost:8000',
            cookieSecret: 'muahatestingmuahatestingmuahates',
            googleCredentials: {id: 'gid', secret: 'gsec'}
        })
        const app = createExpressApp(setup)
        const agent = request.agent(app)
        
        await agent.post('/auth/register').send({
            email: 'test@test.com',
            password: 'supersecure'
        })
        
        const userBeforeValidation = await setup.components.storage.users.findByIdentifier('email:test@test.com')
        expect(userBeforeValidation).toEqual(expect.objectContaining({
            identifier: 'email:test@test.com',
            isActive: false
        }))

        const verificationCodes = await setup.components.storage._mananger.collection('userEmailVerificationCode').findObjects({})
        expect(verificationCodes).toEqual([
            expect.objectContaining({
            })
        ])
        const verificationResponse = await agent.get('/email/verify').query({
            code: verificationCodes[0]['code'],
        })
        fixSessionCookie(verificationResponse, agent)

        const userAfterValidation = await setup.components.storage.users.findByIdentifier('email:test@test.com')
        expect(userAfterValidation).toEqual(expect.objectContaining({
            identifier: 'email:test@test.com',
            isActive: true
        }))

        const checkResponse = await agent.get('/auth/check')
        expect(checkResponse.body).toEqual({
            authenticated: true
        })
    })

    it.skip('should handle the login flow correctly', async () => {
        const setup = await createSetup({
            tier: 'production',
            mailer: 'memory',
            storageBackend: 'memory',
            domain: 'localhost:8000',
            baseUrl: 'http://localhost:8000',
            cookieSecret: 'muahatestingmuahatestingmuahates',
            googleCredentials: {id: 'gid', secret: 'gsec'}
        })
        const app = createExpressApp(setup)
        const agent = request.agent(app)

        const email = 'something@foo.com', password = 'ulnevaguess'
        const passwordHash = await setup.components.passwordHasher.hash(password)
        await setup.components.storage._mananger.collection('user').createObject({
            identifier: `email:${email}`,
            passwordHash,
            isActive: true,
        })
        
        const loginResponse = await agent.post('/auth/login').send({email, password})
        fixSessionCookie(loginResponse, agent)

        const checkResponse = await agent.get('/auth/check')
        expect(checkResponse.body).toEqual({
            authenticated: true
        })
        fixSessionCookie(checkResponse, agent)
    })

    it('should handle the passwordless login flow correctly', async () => {
        const setup = await createSetup({
            tier: 'production',
            mailer: 'memory',
            storageBackend: 'memory',
            domain: 'localhost:8000',
            baseUrl: 'http://localhost:8000',
            cookieSecret: 'muahatestingmuahatestingmuahates',
            googleCredentials: {id: 'gid', secret: 'gsec'}
        })
        const app = createExpressApp(setup)
        const agent = request.agent(app)

        await testLoginFlow({setup, agent})
    })
})

export async function testLoginFlow({setup, agent}) {
    const email = 'something@foo.com', password = 'ulnevaguess'
    const passwordHash = await setup.components.passwordHasher.hash(password)
    await setup.components.storage._mananger.collection('user').createObject({
        identifier: `email:${email}`,
        passwordHash,
        isActive: true,
    })

    const wrongLoginStartResponse = await agent.post('/auth/passwordless/login/start').send({
        email: 'idont@exist.com',
        successUrl: '/success/',
        failureUrl: '/fail/'
    })
    expect(wrongLoginStartResponse.redirect).toBe(true)
    expect(wrongLoginStartResponse.headers.location).toEqual('/fail/')
    
    const correctLoginStartResponse = await agent.post('/auth/passwordless/login/start').send({
        email,
        successUrl: '/success/',
        failureUrl: '/fail/'
    })
    expect(correctLoginStartResponse.redirect).toBe(true)
    expect(correctLoginStartResponse.headers.location).toEqual('/success/')
    
    const tokens = await setup.components.storage._mananger.collection('passwordlessToken').findObjects({})
    expect(tokens).toEqual([
        expect.objectContaining({
        })
    ])

    const loginResponse = await agent.get('/auth/passwordless/login/finish').query({
        email,
        token: tokens[0]['tokenString'],
    })
    fixSessionCookie(loginResponse, agent)

    const checkResponse = await agent.get('/auth/check')
    expect(checkResponse.body).toEqual({
        authenticated: true
    })
    fixSessionCookie(checkResponse, agent)

}
