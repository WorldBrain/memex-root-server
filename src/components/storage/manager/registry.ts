import {
    CollectionDefinitions,
    CollectionDefinition,
    IndexSourceField,
    isConnectsRelationship,
    isChildOfRelationship,
    isRelationshipReference,
    getChildOfRelationshipTarget
} from './types'
import FIELD_TYPES from './fields'

export interface RegistryCollections {
    [collName: string]: CollectionDefinition
}

export interface RegistryCollectionsVersionMap {
    [collVersion: number]: CollectionDefinition[]
}

export default class StorageRegistry {
    public collections: RegistryCollections = {}
    public collectionsByVersion: RegistryCollectionsVersionMap = {}

    registerCollection(name: string, defs: CollectionDefinitions) {
        if (!(defs instanceof Array)) {
            defs = [defs]
        }

        defs.sort(def => def.version.getTime()).forEach(def => {
            this.collections[name] = def
            def.name = name

            const fields = def.fields
            Object.entries(fields).forEach(([fieldName, fieldDef]) => {
                const FieldClass = FIELD_TYPES[fieldDef.type]
                
                if (FieldClass) {
                    fieldDef.fieldObject = new FieldClass(fieldDef)
                }
            })

            this._preprocessCollectionRelationships(def)
            this._preprocessCollectionIndices(name, def)

            const version = def.version.getTime()
            this.collectionsByVersion[version] =
                this.collectionsByVersion[version] || []
            this.collectionsByVersion[version].push(def)
        })
    }

    /**
     * Handles mutating a collection's definition to flag all fields that are declared to be
     * indexable as indexed fields.
     */
    _preprocessCollectionIndices(name : string, def: CollectionDefinition) {
        const flagField = (fieldName : string, indexDefIndex : number) => {
            def.fields[fieldName]._index = indexDefIndex
        }
        const flagIndexSourceField = (indexSource: IndexSourceField, indexDefIndex : number) => {
            if (isRelationshipReference(indexSource)) {
                const relationship = def.relationshipsByAlias[indexSource.relationship]
                if (isConnectsRelationship(relationship)) {
                    relationship.fieldNames.forEach(fieldName => flagField(fieldName, indexDefIndex))
                } else if (isChildOfRelationship(relationship)) {
                    flagField(relationship.fieldName, indexDefIndex)
                }
            } else {
                flagField(<string>indexSource, indexDefIndex)
            }
        }

        const indices = def.indices || []
        indices.forEach(({ field: indexSourceFields }, indexDefIndex) => {
            // Compound indexes need to flag all specified fields
            if (indexSourceFields instanceof Array) {
                indexSourceFields.forEach(indexSource => {flagIndexSourceField(indexSource, indexDefIndex)})
            } else if (typeof indexSourceFields === 'string') {
                flagField(indexSourceFields, indexDefIndex)
            } else {
                throw Error('Got an invalid index for this collection: '+ name)
            }
        })
    }

    /**
     * Creates the fields and indices for relationships
     */
    _preprocessCollectionRelationships(def: CollectionDefinition) {
        def.relationships = def.relationships || []
        def.relationshipsByAlias = {}
        for (const relationship of def.relationships) {
            if (isConnectsRelationship(relationship)) {
                relationship.fieldNames = relationship.fieldNames || [
                    `${relationship.connects[0]}`,
                    `${relationship.connects[1]}`
                ]
                def.indices.push({field: relationship.fieldNames})
            } else if (isChildOfRelationship(relationship)) {
                relationship.targetCollection = getChildOfRelationshipTarget(relationship)
                relationship.alias = relationship.alias || relationship.targetCollection
                def.relationshipsByAlias[relationship.alias] = relationship

                relationship.fieldName = relationship.fieldName || `${relationship.alias}Rel`
                def.indices.push({field: relationship.fieldName})
            } else {
                throw new Error("Invalid relationship detected: " + JSON.stringify(relationship))
            }
        }
    }
}
