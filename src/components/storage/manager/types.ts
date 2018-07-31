import StorageRegistry from './registry'
import { Field } from './fields'

export type FieldType = 'text' | 'json' | 'datetime' | 'string' | 'url'

// TODO
export interface MigrationRunner {
    (): Promise<void>
    _seen?: boolean
}

export type CollectionDefinitionMap = {[name : string] : CollectionDefinitions}

export type CollectionDefinitions =
    | CollectionDefinition[]
    | CollectionDefinition

export interface CollectionFields {
    [fieldName: string]: CollectionField
}

export interface CollectionField {
    type: FieldType
    optional?: boolean
    fieldObject?: Field
    _index?: number
}

export type IndexSourceField = string | RelationshipReference
export type IndexSourceFields = IndexSourceField | IndexSourceField[]

export interface IndexDefinition {
    /**
     * Points to a corresponding field name defined in the `fields` part of the collection definition.
     * In the case of a compound index, this should be a pair of fields expressed as an `Array`.
     */
    field: IndexSourceFields
    /**
     * Denotes whether or not this index should be a primary key. There should only be one index
     * with this flag set.
     */
    pk?: boolean
    /**
     * Denotes the index being enforced as unique.
     */
    unique?: boolean
    /**
     * Denotes the primary key index will be auto-incremented.
     * Only used if `pk` flag also set. Implies `unique` flag set.
     */
    autoInc?: boolean
    /**
     * Sets a custom name for the corresponding index created to afford full-text search.
     * Note that this will only be used if the corresponding field definition in `fields` is
     * of `type` `'text'`.
     */
    fullTextIndexName?: string
}

export interface RelationshipType {
    alias?: string
}

export interface ChildOfRelationship extends RelationshipType {
    targetCollection?: string // = singleChildOf || childOf
    fieldName?: string
}

export interface MultipleChildOfRelationship extends ChildOfRelationship {
    childOf: string
}
export interface SingleChildOfRelationship extends ChildOfRelationship {
    singleChildOf: string
}
export const isChildOfRelationship =
    (relationship) : relationship is ChildOfRelationship =>
        !!(<MultipleChildOfRelationship>relationship).childOf ||
        !!(<SingleChildOfRelationship>relationship).singleChildOf
export const getChildOfRelationshipTarget = (relationship : ChildOfRelationship) =>
    (<SingleChildOfRelationship>relationship).singleChildOf ||
    (<MultipleChildOfRelationship>relationship).childOf

export interface ConnectsRelationship extends RelationshipType {
    connects: [string, string]
    fieldNames?: [string, string]
}
export const isConnectsRelationship =
    (relationship : Relationship) : relationship is ConnectsRelationship =>
        !!(<ConnectsRelationship>relationship).connects

export type Relationship = SingleChildOfRelationship | MultipleChildOfRelationship | ConnectsRelationship
export type Relationships = Relationship[]
export type RelationshipsByAlias = {[alias : string] : Relationship}
export type RelationshipReference = {relationship : string}
export const isRelationshipReference = (reference) : reference is RelationshipReference => !!(<RelationshipReference>reference).relationship

export interface CollectionDefinition {
    version: Date
    fields: CollectionFields
    indices: IndexDefinition[]
    relationships?: Relationships
    relationshipsByAlias?: RelationshipsByAlias
    migrate?: MigrationRunner
    name?: string
    watch?: boolean // should we include this in the 'changing' event? defaults to true
    backup?: boolean
}
