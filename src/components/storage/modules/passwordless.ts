import { CollectionDefinitionMap } from "../manager/ts/types"
import { StorageModule } from "./types"

export class PasswordlessTokenStorage extends StorageModule {
    collectionDefinitions : CollectionDefinitionMap = {
        passwordlessToken: {
            version: new Date(2018, 7, 31),
            fields: {
                email: { type: 'string' },
                tokenString: { type: 'random-key' },
                expires: { type: 'datetime' },
            },
            indices: [
                { field: 'email' },
                { field: ['email', 'tokenString'] },
            ]
        },
    }

    public tokenLifetimeInMs: number

    constructor({tokenLifetimeInMs} : {tokenLifetimeInMs : number}) {
        super()

        this.tokenLifetimeInMs = tokenLifetimeInMs
    }

    async createToken({email, tokenString} : {email : string, tokenString? : string}) : Promise<string> {
        await this.collections.passwordlessToken.deleteObjects({email})
        const toInsert = {email, expires: Date.now() + this.tokenLifetimeInMs}
        if (tokenString) {
            toInsert['tokenString'] = tokenString
        }
        const {object} = await this.collections.passwordlessToken.createObject(toInsert)
        return object.tokenString
    }

    async authenticate({email, token : tokenString} : {email : string, token : string}) {
        const token = await this.collections.passwordlessToken.findOneObject({email, tokenString})
        if (!token) {
            return false
        }

        if ((<Date>token['expires']).valueOf() < Date.now()) {
            return false
        }

        await this.collections.passwordlessToken.deleteObjects({email})
        return true
    }
}
