const fromPairs = require('lodash/fp/fromPairs')
const mapValues = require('lodash/fp/mapValues')
import * as Sequelize from 'sequelize'
import { StorageRegistry } from '../../manager/ts'
// import { CollectionDefinition } from '../../manager/types'
import * as backend from '../../manager/ts/types/backend'
import { augmentCreateObject } from '../../manager/ts/backend/utils'
import { collectionToSequelizeModel, connectSequelizeModels } from './models'
import { operatorsAliases } from './operators'
import { cleanRelationshipFieldsForWrite, cleanRelationshipFieldsForRead } from './utils';
import { createPostgresDatabaseIfNecessary } from './create-database';

export class SequelizeStorageBackend extends backend.StorageBackend {
    private sequelizeConfig : Sequelize.Options | string
    private sequelize : {[database : string]: Sequelize.Sequelize}
    private sequelizeModels : {[database : string]: {[name : string]: any}} = {}
    private defaultDatabase : string
    private databases : string[]

    constructor({sequelizeConfig, defaultDatabase, databases} : {sequelizeConfig : any, defaultDatabase? : string, databases? : string[]}) {
        super()
        
        this.sequelizeConfig = sequelizeConfig
        this.defaultDatabase = defaultDatabase || sequelizeConfig.database || 'default'
        this.databases = databases || ['default']
    }

    configure({registry} : {registry : StorageRegistry}) {
        super.configure({registry})
        registry.once('initialized', this._createModels)

        const origCreateObject = this.createObject.bind(this)
        this.createObject = async (collection, object, options = {}) => {
            const sequelize = this.sequelize[options.database || this.defaultDatabase]
            return await sequelize.transaction(async transaction => {
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
            this.sequelize = fromPairs(this.databases.map(database => [database, new Sequelize(<string>this.sequelizeConfig, defaultOptions)]))
        } else {
            this.sequelize = fromPairs(this.databases.map(database => [database, new Sequelize({
                ...defaultOptions,
                ...<Sequelize.Options>this.sequelizeConfig,
                database,
            })]))
        }
        for (const database of this.databases) {
            this.sequelizeModels[database] = {}

            for (const [name, definition] of Object.entries(this.registry.collections)){
                this.sequelizeModels[database][name] = this.sequelize[database].define(
                    name, collectionToSequelizeModel({definition, registry: this.registry})
                )
            }
        }
        for (const database of this.databases) {
            connectSequelizeModels({registry: this.registry, models: this.sequelizeModels[database]})
        }
    }

    async migrate({database} : {database? : string} = {}) {
        if (typeof this.sequelizeConfig !== 'string' && this.sequelizeConfig['dialect'] === 'postgres') {
            const { host, port, username, password, database } = this.sequelizeConfig
            await createPostgresDatabaseIfNecessary({ host, port, username, password, database })
        }
        await this.sequelize[database || this.defaultDatabase].sync()
    }

    async cleanup() : Promise<any> {

    }

    async createObject(collection : string, object, options? : backend.CreateSingleOptions & {_transaction?}) : Promise<backend.CreateSingleResult> {
        // console.log('creating object in collection', collection)
        const model = this.sequelizeModels[this.defaultDatabase][collection]
        const cleanedObject = cleanRelationshipFieldsForWrite(object, this.registry.collections[collection])
        const instance = await model.create(cleanedObject, {transaction: options._transaction})
        // console.log('created object in collection', collection)
        return {object: instance.dataValues}
    }
    
    async findObjects<T>(collection : string, query, options = {}) : Promise<Array<T>> {
        // console.log('finding object in collection', collection)
        const collectionDefinition = this.registry.collections[collection]
        const model = this.sequelizeModels[this.defaultDatabase][collection]
        const instances = await model.findAll({where: cleanRelationshipFieldsForWrite(query, collectionDefinition)})
        // console.log('done finding object in collection', collection)
        return instances.map(instance => cleanRelationshipFieldsForRead(
            instance.dataValues,
            collectionDefinition
        ))
    }
    
    async updateObjects(collection : string, query, updates, options : backend.UpdateManyOptions & {transaction?} = {}) : Promise<backend.UpdateManyResult> {
        const model = this.sequelizeModels[this.defaultDatabase][collection]
        await model.update(updates, {where: query}, {transaction: options._transaction})
    }
    
    async deleteObjects(collection : string, query, options : backend.DeleteManyOptions = {}) : Promise<backend.DeleteManyResult> {
        if (options.limit) {
            const count = await this.sequelizeModels[this.defaultDatabase][collection].count({ where: query })
            if (count > options.limit) {
                throw new backend.DeletionTooBroadError(collection, query, options.limit, count)
            }
        }

        const model = this.sequelizeModels[this.defaultDatabase][collection]
        await model.destroy({where: query})
    }
}
