import * as pluralize from 'pluralize'
import {
    isConnectsRelationship,
    isChildOfRelationship,
    isRelationshipReference,
    getChildOfRelationshipTarget,
    SingleChildOfRelationship,
} from './types/relationships'
import { CollectionDefinitions, CollectionDefinition } from './types/collections'
import { IndexSourceField } from './types/indices'
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

            this._preprocessCollectionRelationships(name, def)
            this._preprocessCollectionIndices(name, def)

            const version = def.version.getTime()
            this.collectionsByVersion[version] =
                this.collectionsByVersion[version] || []
            this.collectionsByVersion[version].push(def)
        })
    }

    finishInitialization() {
        this._connectReverseRelationships()
    }

    /**
     * Handles mutating a collection's definition to flag all fields that are declared to be
     * indexable as indexed fields.
     */
    _preprocessCollectionIndices(collectionName : string, def: CollectionDefinition) {
        this._autoAssignCollectionPk(def)

        const flagField = (fieldName : string, indexDefIndex : number) => {
            if (!def.fields[fieldName]) {
                throw new Error(`Flagging field ${fieldName} of collection ${collectionName} as index, but field does not exist`)
            }
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
        indices.forEach(({ field: indexSourceFields, pk: isPk }, indexDefIndex) => {
            // Compound indexes need to flag all specified fields
            if (indexSourceFields instanceof Array) {
                indexSourceFields.forEach(indexSource => {flagIndexSourceField(indexSource, indexDefIndex)})
            } else if (typeof indexSourceFields === 'string') {
                flagField(indexSourceFields, indexDefIndex)
            } else {
                throw Error('Got an invalid index for this collection: '+ collectionName)
            }
        })
    }

    _autoAssignCollectionPk(def: CollectionDefinition) {
        const indices = def.indices || []
        indices.forEach(({ field: indexSourceFields, pk: isPk }, indexDefIndex) => {
            if (isPk) {
                def.pkIndex = indexSourceFields
            }
        })
        if (!def.pkIndex) {
            indices.unshift({field: 'id', pk: true})
            def.pkIndex = 'id'
        }
        if (typeof def.pkIndex === 'string' && !def.fields[def.pkIndex]) {
            def.fields[def.pkIndex] = {type: 'auto-pk'}
        }
    }

    /**
     * Creates the fields and indices for relationships
     */
    _preprocessCollectionRelationships(name : string, def: CollectionDefinition) {
        def.relationships = def.relationships || []
        def.relationshipsByAlias = {}
        def.reverseRelationshipsByAlias = {}
        for (const relationship of def.relationships) {
            if (isConnectsRelationship(relationship)) {
                relationship.aliases = relationship.aliases || relationship.connects
                relationship.fieldNames = relationship.fieldNames || [
                    `${relationship.aliases[0]}Rel`,
                    `${relationship.aliases[1]}Rel`
                ]
                
                relationship.reverseAliases = relationship.reverseAliases || [
                    pluralize(relationship.connects[1]),
                    pluralize(relationship.connects[0]),
                ]

                def.indices.push({field: relationship.fieldNames})
            } else if (isChildOfRelationship(relationship)) {
                relationship.sourceCollection = name
                relationship.targetCollection = getChildOfRelationshipTarget(relationship)
                relationship.single = !!(<SingleChildOfRelationship>relationship).singleChildOf
                relationship.alias = relationship.alias || relationship.targetCollection
                def.relationshipsByAlias[relationship.alias] = relationship

                if (!relationship.reverseAlias) {
                    relationship.reverseAlias = relationship.single ? name : pluralize(name)
                }

                relationship.fieldName = relationship.fieldName || `${relationship.alias}Rel`
                def.indices.push({field: relationship.fieldName})
            } else {
                throw new Error("Invalid relationship detected: " + JSON.stringify(relationship))
            }
        }
    }

    _connectReverseRelationships() {
        Object.values(this.collections).forEach(sourceCollectionDef => {
            for (const relationship of sourceCollectionDef.relationships) {
                if (isConnectsRelationship(relationship)) {
                    this.collections[relationship.connects[0]].reverseRelationshipsByAlias[relationship.reverseAliases[0]] = relationship
                    this.collections[relationship.connects[1]].reverseRelationshipsByAlias[relationship.reverseAliases[1]] = relationship
                } else if (isChildOfRelationship(relationship)) {
                    const targetCollectionDef = this.collections[relationship.targetCollection]
                    targetCollectionDef.reverseRelationshipsByAlias[relationship.reverseAlias] = relationship
                }
            }
        })
    }
}
