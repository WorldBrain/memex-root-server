import StorageManager from './manager'
import { StorageModule } from './modules/types'
import { UserStorage } from './modules/auth'

export class Storage {
    users : UserStorage
    private _mananger : StorageManager

    constructor({storageManager} : {storageManager : StorageManager}) {
        this._mananger = storageManager
        
        this._registerModule('users', new UserStorage({users: storageManager.collection('users')}))
        
        this._mananger.finishInitialization()
    }

    async cleanup() {
        await this._mananger.backend.cleanup()
    }

    _registerModule(name : string, module : StorageModule) {
        this[name] = module
        this._mananger.registry.registerCollections(module.collectionDefinitions)
    }
}
