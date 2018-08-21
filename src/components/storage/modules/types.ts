import { CollectionDefinitionMap } from '../manager/ts/types'
import { StorageCollectionMap } from '../manager/ts'

export class StorageModule {
    collectionDefinitions : CollectionDefinitionMap
    protected collections : StorageCollectionMap

    configure(collections : StorageCollectionMap) {
        this.collections = collections
    }
}
