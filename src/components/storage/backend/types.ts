export type PutResult = any

export abstract class StorageBackend {
    async cleanup() : Promise<any> {}
    abstract putObject(collection : string, object) : Promise<PutResult>
    abstract findObject<T>(collection : string, query, options) : Promise<T | null>
}
