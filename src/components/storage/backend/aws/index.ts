import * as dynongo from 'dynongo'
import { StorageRegistry } from '../../manager'
import { CollectionDefinition } from '../../manager/types'
import { StorageBackend } from '../types'

export type DynamoManagement = {createTable : Function, deleteTable : Function}

export class AwsStorageBackend extends StorageBackend {
    private dynongoClient

    constructor({connectionParams} : {connectionParams?} = {}) {
        super()

        this.dynongoClient = dynongo
        this.dynongoClient.connect(connectionParams)
    }

    async migrate(registry : StorageRegistry) {
        await Promise.all(Object.entries(registry.collections).map(([collectionName, collectionDefinition]) => {
            const schema = _convertCollectionDefinitionToSchema(collectionName, collectionDefinition)
            return this.dynongoClient.createTable(schema)
        }))
    }

    async putObject(collectionName : string, object) {
        const tableName = _collectionNameToTable(collectionName)
        await this.dynongoClient.table(tableName).insert(object)
    }

    async findObject(collectionName : string, query, options) {
        const tableName = _collectionNameToTable(collectionName)
        return await this.dynongoClient.table(tableName).findOne(query)
    }
}

export async function createLocalAwsStorageBackend({port} : {port : number}) {
    const DynamoDbLocal = require('dynamodb-local')
    const child = await DynamoDbLocal.launch(port, null, [], false, true)
    const backend = new AwsStorageBackend({
        connectionParams: {
            local: true,
            localPort: port
        }
    })
    backend.cleanup = async () => DynamoDbLocal.stopChild(child)
    return backend
}

export function _collectionNameToTable(collection : string) : string {
    return collection.substr(0, 1) + collection.substr(1)
}

export function _convertCollectionDefinitionToSchema(collectionName : string, definition : CollectionDefinition) {
    return {
        TableName: _collectionNameToTable(collectionName),
        AttributeDefinitions: [
            { AttributeName: 'id', AttributeType: 'S' }
        ],
        KeySchema: [
            { AttributeName: 'id', KeyType: 'HASH' }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1
        }
    }
}