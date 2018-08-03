import { StorageBackend } from '../types'
import StorageRegistry from '../registry'
import { RandomKeyField } from '../fields'
import { augmentPutObject } from './utils'

export class FakeRandomKeyField extends RandomKeyField {
    public counter = 1

    async generateCode() {
        return `no-so-random-key-${this.counter++}`
    }
}
export interface FakeStorageBackendConfig {
    idGenerator: (collection, object, options) => string
}
export class FakeStorageBackend extends StorageBackend {
    public putOperations: { object, id }[] = []

    constructor(public config: FakeStorageBackendConfig) {
        super()
    }

    configure({ registry }: { registry: StorageRegistry }) {
        super.configure({ registry })
        registry.fieldTypes.registerType('random-key', FakeRandomKeyField)

        this.putObject = augmentPutObject(this.putObject.bind(this), { registry })
    }

    async createObject(collection: string, object, options) {
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

    async findObjects() {
        return []
    }

    async updateObjects() {

    }

    async deleteObjects() {

    }
}

