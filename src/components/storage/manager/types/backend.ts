import StorageRegistry from "../registry"

export type PutManyOptions = any
export type PutManyResult = any
export type PutSingleOptions = any
export type PutSingleResult = any
export type UpdateManyOptions = any
export type UpdateManyResult = any
export type UpdateSingleOptions = any
export type UpdateSingleResult = any
export type DeleteSingleOptions = any
export type DeleteSingleResult = any
export type DeleteManyOptions = any
export type DeleteManyResult = any

export abstract class StorageBackend {
    protected registry : StorageRegistry

    configure({registry} : {registry : StorageRegistry}) {
        this.registry = registry
    }

    async cleanup() : Promise<any> {}
    async migrate() : Promise<any> {}

    abstract putObject(collection : string, object, options? : PutSingleOptions) : Promise<PutSingleResult>
    
    abstract findObjects<T>(collection : string, query, options?) : Promise<Array<T>>
    async findObject<T>(collection : string, query, options?) : Promise<T | null> {
        const objects = await this.findObjects<T>(collection, query, {...options, limit: 1})
        if (!objects.length) {
            return null
        }

        return objects[0]
    }
    
    abstract updateObjects(collection : string, query, updates, options? : UpdateManyOptions) : Promise<UpdateManyResult>
    async updateObject(collection : string, object, updates, options? : UpdateSingleOptions) : Promise<UpdateSingleResult> {
        const definition = this.registry.collections[collection]
        if (typeof definition.pkIndex === 'string') {
            return await this.updateObject(collection, {[definition.pkIndex]: object[definition.pkIndex]}, updates, options)
        } else {
            throw new Error('Updating single objects with compound pks is not supported yet')
        }
    }
    
    abstract deleteObjects(collection : string, query, options? : DeleteSingleOptions) : Promise<DeleteManyResult>
    async deleteObject(collection : string, object, options? : DeleteManyOptions) : Promise<DeleteSingleResult> {

    }
}
