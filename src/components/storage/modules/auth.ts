import { User } from "../../../types/auth"
import { StorageCollectionMap } from '../manager'
import { CollectionDefinitionMap } from "../manager/types"
import { StorageModule } from "./types"

export class UserStorage implements StorageModule {
    collectionDefinitions : CollectionDefinitionMap = {
        user: {
            version: new Date(2018, 7, 31),
            fields: {
                identifier: {type: 'string'},
                passwordHash: {type: 'string', optional: true},
                isActive: {type: 'boolean'},
            },
            indices: [
                {field: 'identifier'},
            ]
        },
        userEmail: {
            version: new Date(2018, 7, 31),
            fields: {
                email: {type: 'string'},
                isVerified: {type: 'boolean'},
                isPrimary: {type: 'boolean'},
            },
            relationships: [
                {childOf: 'user', reverseAlias: 'emails'}
            ],
            indices: [
                {field: [{relationship: 'user'}, 'email'], unique: true}
            ]
        },
        userEmailVerificationCode: {
            version: new Date(2018, 7, 31),
            fields: {
                code: {type: 'random-key'},
                expiry: {type: 'datetime'}
            },
            relationships: [
                {singleChildOf: 'userEmail', reverseAlias: 'verificationCode'}
            ],
            indices: [
                {field: 'verificationCode', unique: true}
            ]
        },
        userAccountLink: {
            version: new Date(2018, 7, 31),
            fields: {
                provider: {type: 'string'}
            },
            relationships: [
                {singleChildOf: 'user'}
            ],
            indices: [
            ]
        }
    }

    constructor(private collections : StorageCollectionMap) {
    }

    async registerUser({email, passwordHash} : {email, passwordHash : string}) {
        const {object: user} = await this.collections.users.putObject({
            identifier: `email:${email}`,
            passwordHash,
            isActive: false,
            userEmails: [
                {
                    email,
                    isVerified: false,
                    isPrimary: true,
                    verificationCode: {
                        expires: Date.now() + 1000 * 60 * 60 * 24
                    }
                }
            ]
        })

        return {
            emailVerificationCode: user.emails[0].verificationCode.code
        }
    }

    async verifyUserEmail({code} : {code : string}) : Promise<{identifier : string, email : string} | null> {
        const verificationCode = await this.collections.userEmailVerificationCode.findOneObject({code})
        if (!verificationCode) {
            return null
        }

        const userEmail = await this.collections.userEmail.findOneObject({id: verificationCode['userEmail']})        
        const user = await this.collections.user.findOneObject({id: userEmail['user']})
        
        const isPrimary = !user['isActive'] ? {isPrimary: true} : {}
        await this.collections.userEmail.updateOneObject(userEmail, {isActive: true, ...isPrimary})
        await this.collections.users.updateOneObject(user, {isActive: true})
        await this.collections.userEmailVerificationCode.deleteOneObject(verificationCode)

        return {identifier: user['identifier'], email: userEmail['email']}
    }

    async findByIdentifier(identifier : string) : Promise<User | null> {
        return await this.collections.users.findOneObject<User>({identifier})
    }
}
