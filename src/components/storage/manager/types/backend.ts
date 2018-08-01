import StorageRegistry from "../registry"

export type PutResult = any

export abstract class StorageBackend {
    protected registry : StorageRegistry

    configure({registry} : {registry : StorageRegistry}) {
        this.registry = registry
    }

    async cleanup() : Promise<any> {}
    abstract putObject(collection : string, object, options?) : Promise<PutResult>
    abstract findObject<T>(collection : string, query, options?) : Promise<T | null>
}
