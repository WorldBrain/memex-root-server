import StorageManager, { StorageCollectionMap } from './manager'
import { StorageModule } from './modules/types'
import { UserStorage } from './modules/auth'

export class Storage {
    users : UserStorage
    public _mananger : StorageManager

    constructor({storageManager} : {storageManager : StorageManager}) {
        this._mananger = storageManager
        
        this._registerModule('users', UserStorage)
        
        this._mananger.finishInitialization()
    }

    async cleanup() {
        await this._mananger.backend.cleanup()
    }

    _registerModule(name : string, Module : new () => StorageModule) {
        const module = new Module()

        const collections : StorageCollectionMap = {}
        for (const [collectionName, collectionDefinition] of Object.entries(module.collectionDefinitions)) {
            this._mananger.registry.registerCollection(collectionName, collectionDefinition)
            collections[collectionName] = this._mananger.collection(collectionName)
        }
        module.configure(collections)
        // console.log(collections)

        this[name] = module
    }
}
