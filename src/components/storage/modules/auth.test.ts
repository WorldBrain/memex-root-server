import { expect } from 'chai'
import { createStorage } from "../..";

describe('AuthStorage', () => {
    it('should generate a new verification code if the user is registred but not verified yet', async () => {
        const storage = await createStorage({backend: 'memory'})
        const firstResult = await storage.users.registerUser({ email: 'foo@foo.com', passwordHash: 'foobar' })
        expect(firstResult.emailVerificationCode).to.be.a('string')
        const secondResult = await storage.users.registerUser({ email: 'foo@foo.com', passwordHash: 'foobar' })
        expect(secondResult.emailVerificationCode).to.be.a('string')
        expect(firstResult.emailVerificationCode).not.equal(secondResult.emailVerificationCode)
        expect(firstResult.codeId).to.equal(secondResult.codeId)

        const verificationResult = await storage.users.verifyUserEmail({code: secondResult.emailVerificationCode})
        expect(verificationResult).to.deep.equal({identifier: 'email:foo@foo.com', email: 'foo@foo.com'})
    })
})