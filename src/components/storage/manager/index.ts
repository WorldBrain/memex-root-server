import StorageRegistry from './registry'
import { StorageBackend, PutResult } from '../backend/types'

export { default as StorageRegistry } from './registry'

export interface StorageCollection {
    putObject(object) : Promise<PutResult>
    findObject<T>(query, options?) : Promise<T | null>
}

export interface StorageCollectionMap {
    [name : string] : StorageCollection
}

export class StorageManager {
    public registry = new StorageRegistry()
    public backend : StorageBackend

    constructor({backend} : {backend : StorageBackend}) {
        this.backend = backend
    }

    collection(name : string) : StorageCollection {
        return {
            putObject: (object) => this.backend.putObject(name, object),
            findObject: (query, options?) => this.backend.findObject(name, query, options),
        }
    }
}
