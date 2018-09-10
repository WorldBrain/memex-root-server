import { User } from "../../../types/auth"
import { CollectionDefinitionMap } from "../manager/ts/types"
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
                isActive: { type: 'boolean' },
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

    async registerUser({email, passwordHash, active = false} : {email, passwordHash : string, active? : boolean}) {
        const identifier = `email:${email}`
        const existingUser = await this.collections.user.findOneObject({identifier})
        if (existingUser) {
            if (existingUser['isActive']) {
                return { error: 'exists' }
            }

            // Hack, should be done automatically in future
            const code = await this.collectionDefinitions['userEmailVerificationCode']['fields']['code'].fieldObject.prepareForStorage(undefined)

            const email = await this.collections.userEmail.findOneObject({user: existingUser['id']})
            const verificationCode = await this.collections.userEmailVerificationCode.findOneObject({ userEmail: email['id'] })
            const codeId = verificationCode['id']
            await this.collections.userEmailVerificationCode.updateOneObject(
                {id: codeId},
                {code, expires: Date.now() + 1000 * 60 * 60 * 24}
            )
            return {emailVerificationCode: code, codeId}
        }

        const verificationCode = !active ? {
            expiry: Date.now() + 1000 * 60 * 60 * 24
        } : null
        const {object: user} = await this.collections.user.createObject({
            identifier: identifier,
            passwordHash,
            isActive: active,
            emails: [
                {
                    email,
                    isVerified: !active,
                    isPrimary: true,
                    verificationCode
                }
            ]
        })

        return {
            emailVerificationCode: !active ? user.emails[0].verificationCode.code : null,
            codeId: !active ? user.emails[0].verificationCode.id : null
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

        if (verificationCode['expiry'].getTime() <= Date.now()) {
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

    async findById(id : string, {withPasswordHash = false} = {}) : Promise<User | null> {
        return await this._findBy({id}, {withPasswordHash})
    }

    async findByIdentifier(identifier : string, {withPasswordHash = false} = {}) : Promise<User | null> {
        return await this._findBy({identifier}, {withPasswordHash})
    }

    async _findBy(query, {withPasswordHash = false} = {}) : Promise<User | null> {
        const user = await this.collections.user.findOneObject<User>(query);
        if (!user) {
            return null
        }
        if (!withPasswordHash) {
            delete user['passwordHash'] // Just to prevent accidental data leaking
        }
        return user
    }
}
