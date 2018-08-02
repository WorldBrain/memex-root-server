import * as bluebird from 'bluebird'
const bcrypt = bluebird.promisifyAll(require('bcryptjs'))

export class PasswordHasher {
    private saltWorkFactor : number

    constructor({saltWorkFactor} : {saltWorkFactor : number}) {
        this.saltWorkFactor = saltWorkFactor
    }

    async hash(password : string) {
        const salt = await bcrypt.genSaltAsync(this.saltWorkFactor)
        const hash = await bcrypt.hashAsync(password, salt)
        return hash
    }

    async compare({password, hash} : {password : string, hash : string}) : Promise<boolean> {
        return await bcrypt.compareAsync(password, hash)
    }
}