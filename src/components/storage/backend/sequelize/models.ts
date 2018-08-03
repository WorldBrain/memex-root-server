import * as Sequelize from 'sequelize'
import { StorageRegistry } from '../../manager'
import { CollectionDefinition, CollectionDefinitionMap, isChildOfRelationship, isConnectsRelationship } from "../../manager/types"

const FIELD_TYPE_MAP : {[name : string] : any} = {
    'auto-pk': {type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true},
    'text': 'TEXT',
    'json': 'JSON',
    'datetime': 'DATE',
    'string': 'STRING',
    'boolean': 'BOOLEAN',
}

export function collectionToSequelizeModel({definition, registry} : {definition : CollectionDefinition, registry : StorageRegistry}) {
    const model = {}
    for (const [fieldName, fieldDefinition] of Object.entries(definition.fields)) {
        if (fieldDefinition.type == 'foreign-key') {
            continue
        }

        const primitiveType = fieldDefinition.fieldObject ? fieldDefinition.fieldObject.primitiveType : fieldDefinition.type
        const modelFieldDef = typeof FIELD_TYPE_MAP[primitiveType] === 'string'
            ? {type: Sequelize[FIELD_TYPE_MAP[primitiveType]]}
            : {...FIELD_TYPE_MAP[primitiveType]}
        // modelFieldDef.field = fieldDefinition.fieldName

        model[fieldName] = modelFieldDef
    }

    return model
}

export function connectSequelizeModels({registry, models} : {registry : StorageRegistry, models : {[name : string] : any}}) {
    for (const [collectionName, collectionDefinition] of Object.entries(registry.collections)) {
        for (const relationship of collectionDefinition.relationships) {
            if (isChildOfRelationship(relationship)) {
                if (relationship.single) {
                    models[relationship.targetCollection].hasOne(models[collectionName], {
                        foreignKey: relationship.targetCollection
                    })
                } else {
                    models[relationship.targetCollection].hasMany(models[collectionName], {
                        foreignKey: relationship.targetCollection
                    })
                }
            } else if (isConnectsRelationship(relationship)) {
                models[relationship.connects[0]].belongsToMany(relationship.connects[1], {through: collectionName})
            }
        }
    }
}
