import { CollectionDefinitionMap } from '../manager/types'
import { StorageCollectionMap } from '../manager'

export class StorageModule {
    collectionDefinitions : CollectionDefinitionMap
    protected collections : StorageCollectionMap

    configure(collections : StorageCollectionMap) {
        this.collections = collections
    }
}
