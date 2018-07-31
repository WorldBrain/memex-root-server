import { User } from "../../../types/auth"
import { StorageCollectionMap } from '../manager'
import { CollectionDefinitionMap } from "../manager/types"
import { StorageModule } from "./types"

export class UserStorage implements StorageModule {
    collectionDefinitions : CollectionDefinitionMap = {
        user: {
            version: new Date(2018, 7, 31),
            fields: {
                id: {type: 'string'},
                identifier: {type: 'string'},
                passwordHash: {type: 'string', optional: true}
            },
            indices: [
                {field: 'id', pk: true},
                {field: 'identifier'},
            ]
        },
        userEmail: {
            version: new Date(2018, 7, 31),
            fields: {
                email: {type: 'string'},
            },
            relationships: [
                {childOf: 'user'}
            ],
            indices: [
                {field: [{relationship: 'user'}, 'email']}
            ]
        },
        userEmailVerificationCode: {
            version: new Date(2018, 7, 31),
            fields: {
                verificationCode: {type: 'string'},
                verificationCodeExpiry: {type: 'datetime'}
            },
            relationships: [
                {singleChildOf: 'userEmail'}
            ],
            indices: [
                {field: 'verificationCode'}
            ]
        }
    }

    constructor(private collections : StorageCollectionMap) {
    }

    async registerUser(user : User) {

    }

    async findByIdentifier(identifier : string) : Promise<User | null> {
        return await this.collections.users.findObject<User>({identifier})
    }
}
