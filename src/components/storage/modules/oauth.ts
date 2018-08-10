import { CollectionDefinitionMap } from "../manager/types"
import { StorageModule } from "./types"

export class OAuthStorage extends StorageModule {
    collectionDefinitions : CollectionDefinitionMap = {
        oauthClient: {
            version: new Date(2018, 7, 31),
            fields: {
                name: { type: 'string' },
                clientId: { type: 'random-key' },
                clientSecret: { type: 'random-key' },
            },
            indices: [
                { field: 'clientId', pk: true },
                { field: 'name' },
            ]
        },
        oauthGrantCode: {
            version: new Date(2018, 7, 31),
            fields: {
                code: { type: 'random-key' },
                redirectUri: { type: 'string' },
                scope: { type: 'string' }
            },
            relationships: [
                {connects: ['oauthClient', 'user']}
            ],
            indices: [
                { field: 'code', pk: true }
            ]
        },
        oauthAccessToken: {
            version: new Date(2018, 7, 31),
            fields: {
                token: { type: 'random-key' },
                redirectUri: { type: 'string' }
            },
            relationships: [
                {connects: ['oauthClient', 'user']}
            ],
            indices: [
                { field: 'token', pk: true }
            ]
        },
    }

    async createClient({name, ifExists} : {name : string, ifExists : 'retrieve' | 'error'}) {
        const existingClient = await this.collections.oauthClient.findOneObject({name})
        if (existingClient) {
            if (ifExists === 'retrieve') {
                return existingClient
            } else if (ifExists === 'error') {
                throw new Error('You tried to create an OAuth client with an existing name: ' + name)
            }
        }

        return (await this.collections.oauthClient.createObject({name})).object
    }

    async findClient({id: clientId} : {id : string}) {
        const client = <any>await this.collections.oauthClient.findOneObject({clientId})
        client.privileged = client.domain === 'worldbrain.io'
        return client
    }

    async storeGrantCode(
        {clientId : client, redirectUri, userId : user, scope} :
        {clientId : string, redirectUri : string, userId : string, scope : string}
    ) : Promise<{code : string}> {
        return (await this.collections.oauthGrantCode.createObject({
            user, client,
            redirectUri,
            scope,
        })).object
    }

    async findGrantCode({code} : {code : string}) {
        return <any>await this.collections.oauthGrantCode.findOneObject({code})
    }

    async storeAccessToken(
        {userId : user, clientId : client, redirectUri, scope} :
        {userId : string, clientId : string, redirectUri : string, scope : string})
    {
        return await this.collections.oauthAccessToken.createObject({
            user, client,
            redirectUri,
            scope
        })
    }
}
