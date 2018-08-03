import * as Sequelize from 'sequelize'
import { StorageRegistry } from '../../manager'
// import { CollectionDefinition } from '../../manager/types'
import * as backend from '../../manager/types/backend'
import { collectionToSequelizeModel, connectSequelizeModels } from './models'
import { augmentPutObject } from '../utils'

export class SequelizeStorageBackend extends backend.StorageBackend {
    private sequelizeConfig : Sequelize.Options
    private sequelize : Sequelize.Sequelize
    private sequelizeModels : {[name : string]: any}

    constructor({sequelizeConfig} : {sequelizeConfig : Sequelize.Options}) {
        super()
        
        this.sequelizeConfig = sequelizeConfig
    }

    configure({registry} : {registry : StorageRegistry}) {
        super.configure({registry})

        this.sequelize = new Sequelize(this.sequelizeConfig)
        for (const [name, definition] of Object.entries(registry.collections)){
            this.sequelizeModels[name] = this.sequelize.define(name, collectionToSequelizeModel({definition, registry}))
        }
        connectSequelizeModels({registry, models: this.sequelizeModels})

        this.putObject = async (collection, object, options) => {
            return this.transaction({}, async () => {
                return await augmentPutObject(this.putObject.bind(this), { registry })(collection, object, options)
            })
        }
    }

    async migrate() {
        await Promise.all(Object.values(this.sequelizeModels).map(model => model.sync()))
    }

    async cleanup() : Promise<any> {

    }

    async putObject(collection : string, object, options? : backend.PutSingleOptions) : Promise<backend.PutSingleResult> {

    }
    
    async findObjects<T>(collection : string, query, options?) : Promise<Array<T>> {

    }
    
    async updateObjects(collection : string, query, updates, options? : backend.UpdateManyOptions) : Promise<backend.UpdateManyResult> {

    }
    
    async deleteObjects(collection : string, query, options? : backend.DeleteSingleOptions) : Promise<backend.DeleteManyResult> {

    }

    async transaction(options, executor) {

    }
}
