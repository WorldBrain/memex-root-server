import StorageManager from './'
import StorageRegistry from './registry';
import { StorageBackend } from '../manager/types'
import { augmentPutObject } from '../backend/utils'

interface FakeStorageBackendConfig {
    idGenerator : (object, options) => string
}
class FakeStorageBackend extends StorageBackend {
    public putOperations : {object, id}[] = []

    constructor(public config : FakeStorageBackendConfig) {
        super()
    }

    configure({registry} : {registry : StorageRegistry}) {
        super.configure({registry})

        this.putObject = augmentPutObject(this.putObject, {registry})
    }

    async putObject(collection : string, object, options) {
        const pkIndex = this.registry.collections[collection].pkIndex
        if (typeof pkIndex !== 'string') {
            throw new Error("Oops, we don't support compount pk's yet...")
        }

        const id = this.config.idGenerator(object, options)
        this.putOperations.push({object, id})
        return {...object, [pkIndex]: id}
    }

    async findObject() {
        return null
    }
}

describe('StorageManager integration tests', () => {
    it('should handle putObjects with childOf relationships correctly', async () => {
        let id = 0
        const backend = new FakeStorageBackend({
            idGenerator: () => (++id).toString()
        })
        const storageManager = new StorageManager({backend})
        storageManager.registry.registerCollection('user', {
            version: new Date(2018, 7, 31),
            fields: {
                identifier: {type: 'string'},
                passwordHash: {type: 'string', optional: true},
                isActive: {type: 'boolean'},
            },
            indices: [
                {field: 'id', pk: true},
                {field: 'identifier'},
            ]
        })
        storageManager.registry.registerCollection('userEmail', {
            version: new Date(2018, 7, 31),
            fields: {
                email: {type: 'string'},
                isVerified: {type: 'boolean'},
                isPrimary: {type: 'boolean'},
            },
            relationships: [
                {childOf: 'user', reverseAlias: 'emails'}
            ],
            indices: [
                {field: [{relationship: 'user'}, 'email'], unique: true}
            ]
        })
        storageManager.registry.registerCollection('userEmailVerificationCode', {
            version: new Date(2018, 7, 31),
            fields: {
                code: {type: 'random-key'},
                expiry: {type: 'datetime'}
            },
            relationships: [
                {singleChildOf: 'userEmail', reverseAlias: 'verificationCode'}
            ],
            indices: [
                {field: 'verificationCode', unique: true}
            ]
        })
        storageManager.registry.finishInitialization()

        const email = 'blub@bla.com', passwordHash = 'hashed!' 
        const {object: user} = await storageManager.collection('user').putObject({
            identifier: `email:${email}`,
            passwordHash,
            isActive: false,
            userEmails: [
                {
                    email,
                    isVerified: false,
                    isPrimary: true,
                    verificationCode: {
                        expires: Date.now() + 1000 * 60 * 60 * 24
                    }
                }
            ]
        })
        console.log(backend.putOperations)
    })
})
