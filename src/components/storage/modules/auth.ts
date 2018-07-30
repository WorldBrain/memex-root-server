import { User } from "../../../types/auth"
import { StorageCollection } from '../manager'

export class UserStorage {
    constructor(private userCollection : StorageCollection) {
    }

    async findByIdentifier(identifier : string) : Promise<User | null> {
        return this.userCollection.findObject({identifier})
    }
}
