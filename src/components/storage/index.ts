import StorageManager, { StorageCollectionMap } from './manager/ts'
import { StorageModule } from './modules/types'
import { UserStorage } from './modules/auth'
import { OAuthStorage } from './modules/oauth'
import { WpLinkStorage } from './modules/wp-link'
import { PasswordlessTokenStorage } from './modules/passwordless'

export class Storage {
    users : UserStorage
    oauth : OAuthStorage
    wpLinks : WpLinkStorage
    passwordless : PasswordlessTokenStorage
    public _mananger : StorageManager

    constructor({storageManager} : {storageManager : StorageManager}) {
        this._mananger = storageManager
        
        this._registerModule('users', new UserStorage())
        this._registerModule('oauth', new OAuthStorage())
        this._registerModule('wpLinks', new WpLinkStorage())
        this._registerModule('passwordless', new PasswordlessTokenStorage({tokenLifetimeInMs: 1000 * 60 * 10}))
        
        this._mananger.finishInitialization()
    }

    async cleanup() {
        await this._mananger.backend.cleanup()
    }

    _registerModule(name : string, module : StorageModule) {
        const collections : StorageCollectionMap = {}
        for (const [collectionName, collectionDefinition] of Object.entries(module.collectionDefinitions)) {
            this._mananger.registry.registerCollection(collectionName, collectionDefinition)
            collections[collectionName] = this._mananger.collection(collectionName)
        }
        module.configure(collections)

        this[name] = module
    }
}
