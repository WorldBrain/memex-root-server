import { expect } from 'chai';
import StorageManager from './'
import StorageRegistry from './registry';
import { StorageBackend } from '../manager/types'
import { augmentPutObject } from '../backend/utils'
import { inspect } from 'util';

interface FakeStorageBackendConfig {
    idGenerator: (collection, object, options) => string
}
class FakeStorageBackend extends StorageBackend {
    public putOperations: { object, id }[] = []

    constructor(public config: FakeStorageBackendConfig) {
        super()
    }

    configure({ registry }: { registry: StorageRegistry }) {
        super.configure({ registry })

        this.putObject = augmentPutObject(this.putObject.bind(this), { registry })
    }

    async putObject(collection: string, object, options) {
        const pkIndex = this.registry.collections[collection].pkIndex
        if (typeof pkIndex !== 'string') {
            throw new Error("Oops, we don't support compount pk's yet...")
        }

        const id = this.config.idGenerator(collection, object, options)
        this.putOperations.push({ object, id })
        return { object: { ...object, [pkIndex]: id } }
    }

    async findObject() {
        return null
    }
}

describe('StorageManager integration tests', () => {
    it('should handle putObjects with childOf relationships correctly', async () => {
        const ids = {}
        const backend = new FakeStorageBackend({
            idGenerator: collection => {
                ids[collection] = ids[collection] || 0
                return `${collection}-${(++ids[collection]).toString()}`
            }
        })
        const storageManager = new StorageManager({ backend })
        storageManager.registry.registerCollection('user', {
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
        })
        storageManager.registry.registerCollection('userEmail', {
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
        })
        storageManager.registry.registerCollection('userEmailVerificationCode', {
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
        })
        storageManager.registry.finishInitialization()

        const email = 'blub@bla.com', passwordHash = 'hashed!', expires = Date.now() + 1000 * 60 * 60 * 24
        const { object: user } = await storageManager.collection('user').putObject({
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
        })

        expect(user).to.deep.equal({
            id: 'user-1',
            identifier: `email:${email}`,
            passwordHash,
            isActive: false,
            emails: [
                {
                    id: 'userEmail-1',
                    user: 'user-1',
                    email,
                    isVerified: false,
                    isPrimary: true,
                    verificationCode: {
                        id: 'userEmailVerificationCode-1',
                        userEmail: 'userEmail-1',
                        expires
                    }
                }
            ]
        })
        expect(backend.putOperations).to.deep.equal([
            {
                id: 'user-1',
                object: {
                    identifier: 'email:blub@bla.com',
                    passwordHash: 'hashed!',
                    isActive: false
                },
            },
            {
                id: 'userEmail-1',
                object:{
                    user: 'user-1',
                    email: 'blub@bla.com',
                    isVerified: false,
                    isPrimary: true,
                },
            },
            {
                id: 'userEmailVerificationCode-1',
                object: {
                    userEmail: 'userEmail-1',
                    expires: expires,
                },
            }]
        )
    })
})
