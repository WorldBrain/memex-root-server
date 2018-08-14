import * as Sequelize from 'sequelize'
import { StorageRegistry } from '../../manager'
// import { CollectionDefinition } from '../../manager/types'
import * as backend from '../../manager/types/backend'
import { augmentCreateObject } from '../../manager/backend/utils'
import { collectionToSequelizeModel, connectSequelizeModels } from './models'
import { operatorsAliases } from './operators'
import { cleanRelationshipFieldsForWrite, cleanRelationshipFieldsForRead } from './utils';

export class SequelizeStorageBackend extends backend.StorageBackend {
    private sequelizeConfig : Sequelize.Options | string
    private sequelize : Sequelize.Sequelize
    private sequelizeModels : {[name : string]: any} = {}

    constructor({sequelizeConfig} : {sequelizeConfig : any}) {
        super()
        
        this.sequelizeConfig = sequelizeConfig
    }

    configure({registry} : {registry : StorageRegistry}) {
        super.configure({registry})
        registry.once('initialized', this._createModels)

        const origCreateObject = this.createObject.bind(this)
        this.createObject = async (collection, object, options) => {
            return await this.sequelize.transaction(async transaction => {
                const putObject = async (collection, object, options) => {
                    options = options || {}
                    options['_transtaction'] = transaction
                    return await origCreateObject(collection, object, options)
                }
                const augmentedCreateObject = augmentCreateObject(putObject, { registry })
                return await augmentedCreateObject(collection, object, options)
            })
        }
    }

    _createModels = () => {
        const defaultOptions = {
            logging: false,
            operatorsAliases
        }
        if (typeof this.sequelizeConfig === 'string') {
            this.sequelize = new Sequelize(this.sequelizeConfig, defaultOptions)
        } else {
            this.sequelize = new Sequelize({
                ...defaultOptions,
                ...this.sequelizeConfig,
            })
        }
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

    async createObject(collection : string, object, options? : backend.CreateSingleOptions & {_transaction?}) : Promise<backend.CreateSingleResult> {
        const model = this.sequelizeModels[collection]
        const cleanedObject = cleanRelationshipFieldsForWrite(object, this.registry.collections[collection])
        const instance = await model.create(cleanedObject, {transaction: options._transaction})
        return {object: instance.dataValues}
    }
    
    async findObjects<T>(collection : string, query, options = {}) : Promise<Array<T>> {
        const model = this.sequelizeModels[collection]
        const instances = await model.findAll({where: query})
        return instances.map(instance => cleanRelationshipFieldsForRead(
            instance.dataValues,
            this.registry.collections[collection]
        ))
    }
    
    async updateObjects(collection : string, query, updates, options : backend.UpdateManyOptions & {transaction?} = {}) : Promise<backend.UpdateManyResult> {
        const model = this.sequelizeModels[collection]
        await model.update(updates, {where: query}, {transaction: options._transaction})
    }
    
    async deleteObjects(collection : string, query, options : backend.DeleteManyOptions = {}) : Promise<backend.DeleteManyResult> {
        if (options.limit) {
            const count = await this.sequelizeModels[collection].count({ where: query })
            if (count > options.limit) {
                throw new backend.DeletionTooBroadError(collection, query, options.limit, count)
            }
        }

        const model = this.sequelizeModels[collection]
        await model.destroy({where: query})
    }
}
