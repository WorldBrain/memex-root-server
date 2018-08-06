import { User } from "../../../types/auth"
import { StorageCollectionMap } from '../manager'
import { CollectionDefinitionMap } from "../manager/types"
import { StorageModule } from "./types"
import { PasswordHasher } from "../../password-hasher";

export class UserStorage extends StorageModule {
    collectionDefinitions : CollectionDefinitionMap = {
        user: {
            version: new Date(2018, 7, 31),
            fields: {
                identifier: { type: 'string' },
                passwordHash: { type: 'string', optional: true },
                isActive: { type: 'boolean' },
            },
            indices: [
                { field: 'id', pk: true },
                { field: 'identifier' },
            ]
        },
        userEmail: {
            version: new Date(2018, 7, 31),
            fields: {
                email: { type: 'string' },
                isVerified: { type: 'boolean' },
                isPrimary: { type: 'boolean' },
            },
            relationships: [
                { childOf: 'user', reverseAlias: 'emails' }
            ],
            indices: [
                { field: [{ relationship: 'user' }, 'email'], unique: true }
            ]
        },
        userEmailVerificationCode: {
            version: new Date(2018, 7, 31),
            fields: {
                code: { type: 'random-key' },
                expiry: { type: 'datetime' }
            },
            relationships: [
                { singleChildOf: 'userEmail', reverseAlias: 'verificationCode' }
            ],
            indices: [
                { field: 'code', unique: true }
            ]
        }
    }

    async registerUser({email, passwordHash} : {email, passwordHash : string}) {
        const identifier = `email:${email}`
        const existingUser = await this.collections.user.findOneObject({identifier})
        if (existingUser) {
            return { error: 'exists' }
        }

        const {object: user} = await this.collections.user.putObject({
            identifier: identifier,
            passwordHash,
            isActive: false,
            emails: [
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

    async authenticateUser({email, password, passwordHasher} : {email : string, password : string, passwordHasher : PasswordHasher}) {
        const user = await this.collections.user.findOneObject({identifier: `email:${email}`, isActive: true})
        if (!user) {
            return {error: 'not-found'}
        }
        if (!await passwordHasher.compare({password, hash: user['passwordHash']})) {
            return {error: 'invalid-password'}
        }
        if (!user['isActive']) {
            return {error: 'not-active'}
        }
        return {user}
    }

    async verifyUserEmail({code} : {code : string}) : Promise<{identifier : string, email : string} | null> {
        const verificationCode = await this.collections.userEmailVerificationCode.findOneObject({code})
        if (!verificationCode) {
            return null
        }
        if (verificationCode['expires'] <= Date.now()) {
            return null
        }

        const userEmail = await this.collections.userEmail.findOneObject({id: verificationCode['userEmail']})        
        const user = await this.collections.user.findOneObject({id: userEmail['user']})
        
        const isPrimary = !user['isActive'] ? {isPrimary: true} : {}
        await this.collections.userEmail.updateOneObject(userEmail, {isActive: true, ...isPrimary})
        await this.collections.user.updateOneObject(user, {isActive: true})
        await this.collections.userEmailVerificationCode.deleteOneObject(verificationCode)

        return {identifier: user['identifier'], email: userEmail['email']}
    }

    async findByIdentifier(identifier : string) : Promise<User | null> {
        return await this.collections.user.findOneObject<User>({identifier})
    }
}
