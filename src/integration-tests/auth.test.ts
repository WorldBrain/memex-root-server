import * as fs from 'fs'
import * as request from 'supertest'
import * as expect from 'expect'
import { createSetup, createExpressApp } from '../main'

function fixSessionCookie(response, agent) {
    // See this bug https://github.com/facebook/jest/issues/3547
    response.headers['set-cookie'][0]
        .split(',')
        .map(item => item.split(';')[0])
        .forEach(c => agent.jar.setCookie(c))
}

describe('Auth service integration tests', () => {
    it('should handle the signup flow correctly', async () => {
        const setup = await createSetup({
            tier: 'production',
            mailer: 'memory',
            storageBackend: 'memory',
            baseUrl: 'http://localhost:8000',
            cookieSecret: 'muahatesting',
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

        // console.log(await agent.post('/auth/login').send({
        //     email: 'test@test.com',
        //     password: 'supersecure'
        // }))

        const checkResponse = await agent.get('/auth/check')
        expect(checkResponse.body).toEqual({
            authenticated: true
        })
    })

    it('should handle the login flow correctly', async () => {
        const setup = await createSetup({
            tier: 'production',
            mailer: 'memory',
            storageBackend: 'memory',
            baseUrl: 'http://localhost:8000',
            cookieSecret: 'muahatesting',
            googleCredentials: {id: 'gid', secret: 'gsec'}
        })
        const app = createExpressApp(setup)
        const agent = request.agent(app)

        const email = 'something@foo.com', password = 'ulnevaguess'
        const passwordHash = await setup.components.passwordHasher.hash(password)
        await setup.components.storage._mananger.collection('user').putObject({
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
    })
})
