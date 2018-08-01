import pickBy = require('lodash/fp/pickBy')
import { StorageRegistry } from '../manager'
import { isConnectsRelationship, isChildOfRelationship, getOtherCollectionOfConnectsRelationship } from './../manager/types'

// Returns a super-putObject which automatically creates new objects for reverse relationships
export function augmentPutObject(rawPutObject, {registry} : {registry : StorageRegistry}) {
    const augmentedPutObject = async (collection : string, object) => {
        const collectionDefinition = registry.collections[collection]
        
        const objectWithoutReverseRelationships = pickBy((value, key) => {
            return !collectionDefinition.reverseRelationshipsByAlias[key]
        }, object)
        for (const relationshipAlias in collectionDefinition.relationshipsByAlias) {
            const relationship = collectionDefinition.relationshipsByAlias[relationshipAlias]
            if (!isChildOfRelationship(relationship)) {
                continue
            }

            const value = objectWithoutReverseRelationships[relationshipAlias]
            if (value.id) {
                objectWithoutReverseRelationships[relationshipAlias] = value.id
            }
        }

        const {object: insertedObject} = await rawPutObject(collection, objectWithoutReverseRelationships)

        for (const reverseRelationshipAlias in collectionDefinition.reverseRelationshipsByAlias) {
            const reverseRelationship = collectionDefinition.reverseRelationshipsByAlias[reverseRelationshipAlias]
            if (isChildOfRelationship(reverseRelationship)) {
                let objectsToCreate = object[reverseRelationshipAlias]
                if (!objectsToCreate) {
                    continue
                }
                if (reverseRelationship.single) {
                    objectsToCreate = [objectsToCreate]
                }
                if (!reverseRelationship.single) {
                    insertedObject[reverseRelationshipAlias] = []
                }

                const otherCollection = reverseRelationship.sourceCollection
                for (const objectToCreate of objectsToCreate) {
                    objectToCreate[reverseRelationship.alias] = insertedObject[<string>collectionDefinition.pkIndex]
                    
                    const {object: insertedChild} = await augmentedPutObject(otherCollection, objectToCreate)
                    if (reverseRelationship.single) {
                        insertedObject[reverseRelationshipAlias] = insertedChild
                    } else {
                        insertedObject[reverseRelationshipAlias].push(insertedChild)
                    }
                }
            } else if (isConnectsRelationship(reverseRelationship)) {
                throw new Error('Sorry, not implemented yet  :(')
            }
        }

        return {object: insertedObject}
    }

    return augmentedPutObject
}
