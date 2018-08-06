import * as Sequelize from 'sequelize'
import { StorageRegistry } from '../../manager'
// import { CollectionDefinition } from '../../manager/types'
import * as backend from '../../manager/types/backend'
import { collectionToSequelizeModel, connectSequelizeModels } from './models'
import { augmentPutObject } from '../../manager/backend/utils'

export class SequelizeStorageBackend extends backend.StorageBackend {
    private sequelizeConfig : Sequelize.Options
    private sequelize : Sequelize.Sequelize
    private sequelizeModels : {[name : string]: any} = {}

    constructor({sequelizeConfig} : {sequelizeConfig : any}) {
        super()
        
        this.sequelizeConfig = sequelizeConfig
    }

    configure({registry} : {registry : StorageRegistry}) {
        super.configure({registry})
        registry.once('initialized', this._createModels)

        const origPutObject = this.putObject.bind(this)
        this.putObject = async (collection, object, options) => {
            return await this.sequelize.transaction(async transaction => {
                const putObject = async (collection, object, options) => {
                    options = options || {}
                    options['_transtaction'] = transaction
                    return await origPutObject(collection, object, options)
                }
                const augmentedPutObject = augmentPutObject(putObject, { registry })
                return await augmentedPutObject(collection, object, options)
            })
        }
    }

    _createModels = () => {
        this.sequelize = new Sequelize(this.sequelizeConfig)
        for (const [name, definition] of Object.entries(this.registry.collections)){
            this.sequelizeModels[name] = this.sequelize.define(name, collectionToSequelizeModel({definition, registry: this.registry}))
        }
        connectSequelizeModels({registry: this.registry, models: this.sequelizeModels})
    }

    async migrate() {
        await this.sequelize.sync()
    }

    async cleanup() : Promise<any> {

    }

    async createObject(collection : string, object, options? : backend.PutSingleOptions & {_transaction?}) : Promise<backend.PutSingleResult> {
        const model = this.sequelizeModels[collection]
        const instance = await model.create(object, {transaction: options._transaction})
        return {object: instance.dataValues}
    }
    
    async findObjects<T>(collection : string, query, options?) : Promise<Array<T>> {
        const model = this.sequelizeModels[collection]
        const instances = await model.findAll({where: query})
        return instances
    }
    
    async updateObjects(collection : string, query, updates, options? : backend.UpdateManyOptions & {transaction?}) : Promise<backend.UpdateManyResult> {
        const model = this.sequelizeModels[collection]
        await model.update(updates, {where: query}, {transaction: options._transaction})
    }
    
    async deleteObjects(collection : string, query, options? : backend.DeleteSingleOptions) : Promise<backend.DeleteManyResult> {
        const model = this.sequelizeModels[collection]
        await model.destroy({where: query})
    }
}
