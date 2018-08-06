import * as request from 'supertest'
import { createSetup, createExpressApp } from '../main'

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
        
        console.log('??')
        const registrationResponse = await agent.post('/auth/register').send({
            email: 'test@test.com',
            password: 'supersecure'
        })
        console.log(registrationResponse)
        console.log('!?!?', await setup.components.storage.users.findByIdentifier('email:test@test.com'))
    //     expect(await setup.components.storage.users.findByIdentifier('email:test@test.com')).to.deep.equal({})
    })

    it('should handle the login flow correctly', () => {

    })
})
