import * as bluebird from 'bluebird'
import { PrimitiveFieldType } from './types';
const crypto = bluebird.promisifyAll(require('crypto'))

export abstract class Field {
    abstract primitiveType : PrimitiveFieldType

    async prepareForStorage(input) {
        return input
    }

    async prepareFromStorage(stored) {
        return stored
    }
}

export class RandomKeyField extends Field {
    primitiveType = <PrimitiveFieldType>'string'

    async prepareForStorage(input) : Promise<string> {
        if (input) {
            return input
        }

        return (await crypto.randomBytesAsync(20)).toString('hex')
    }
}

export class UrlField extends Field {
    primitiveType = <PrimitiveFieldType>'string'
}

export class FieldTypeRegistry {
    public fieldTypes : {[name : string] : typeof Field} = {}

    registerType(name : string, type : typeof Field) {
        this.fieldTypes[name] = type
        return this
    }

    registerTypes(fieldTypes : {[name : string] : typeof Field}) {
        Object.assign(this.fieldTypes, fieldTypes)
        return this
    }
}

export function createDefaultFieldTypeRegistry() {
    const registry = new FieldTypeRegistry()
    return registry.registerTypes({
        'random-key': RandomKeyField,
        'url': UrlField,
    })
}
