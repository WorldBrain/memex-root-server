import StorageManager from '.'
import { StorageBackend } from './types'

export function createTestStorageManager(backend : StorageBackend) {
    const storageManager = new StorageManager({ backend })
    storageManager.registry.registerCollections({
        user: {
            version: new Date(2018, 7, 31),
            fields: {
                identifier: { type: 'string' },
                passwordHash: { type: 'string', optional: true },
                isActive: { type: 'boolean' },
            },
            indices: [
                { field: 'id', pk: true },
                { field: 'identifier' },
            ]
        },
        userEmail: {
            version: new Date(2018, 7, 31),
            fields: {
                email: { type: 'string' },
                isVerified: { type: 'boolean' },
                isPrimary: { type: 'boolean' },
            },
            relationships: [
                { childOf: 'user', reverseAlias: 'emails' }
            ],
            indices: [
                { field: [{ relationship: 'user' }, 'email'], unique: true }
            ]
        },
        userEmailVerificationCode: {
            version: new Date(2018, 7, 31),
            fields: {
                code: { type: 'random-key' },
                expiry: { type: 'datetime' }
            },
            relationships: [
                { singleChildOf: 'userEmail', reverseAlias: 'verificationCode' }
            ],
            indices: [
                { field: 'code', unique: true }
            ]
        }
    })
    storageManager.finishInitialization()

    return storageManager
}

export function generateTestObject(
    {email = 'blub@bla.com', passwordHash = 'hashed!', expires} :
    {email : string, passwordHash : string, expires : number})
{
    return {
        identifier: `email:${email}`,
        passwordHash,
        isActive: false,
        emails: [
            {
                email,
                isVerified: false,
                isPrimary: true,
                verificationCode: {
                    expires
                }
            }
        ]
    }
}

export function testStorageBackend(backendCreator : () => Promise<StorageBackend>) {
    let backend : StorageBackend
    let storageManager : StorageManager

    beforeEach(async () => {
        backend = await backendCreator()
        storageManager = createTestStorageManager(backend)
        await backend.migrate()
    })

    afterEach(async () => {
        await backend.cleanup()
    })

    it('should do basic CRUD ops', async () => {
        const email = 'blub@bla.com', passwordHash = 'hashed!', expires = Date.now() + 1000 * 60 * 60 * 24
        const { object: user } = await storageManager.collection('user').putObject(generateTestObject({email, passwordHash, expires}))
    })
}