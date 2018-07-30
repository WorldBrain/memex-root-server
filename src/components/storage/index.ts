import { StorageManager } from './manager'
import { UserStorage } from './modules/auth'

export class Storage {
    users : UserStorage
    private _mananger : StorageManager

    constructor({storageManager} : {storageManager : StorageManager}) {
        this.users = new UserStorage(storageManager.collection('users'))
        this._mananger = storageManager
    }

    async cleanup() {
        await this._mananger.backend.cleanup()
    }
}
