import { CollectionDefinitionMap } from "../manager/ts/types"
import { StorageModule } from "./types"

export class WpLinkStorage extends StorageModule {
    collectionDefinitions : CollectionDefinitionMap = {
        wpLink: {
            version: new Date(2018, 7, 31),
            fields: {
                wpId: { type: 'string' },
            },
            relationships: [
                {singleChildOf: 'user'},
            ],
            indices: []
        },
    }

    constructor() {
        super()
    }

    async linkUser({user, wpId} : {user : string, wpId : string}) {
        const existingLink = await this.collections.wpLink.findOneObject({user})
        if (existingLink) {
            if (wpId) {
                await this.collections.wpLink.updateOneObject({user}, {wpId})
            }
        } else {
            await this.collections.wpLink.createObject({user, wpId})
        }
    }

    async getWordpressId({user} : {user : string}) {
        const link = await this.collections.wpLink.findOneObject({user})
        return link && link['wpId']
    }
}
