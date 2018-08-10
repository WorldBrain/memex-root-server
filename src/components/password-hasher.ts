import * as bluebird from 'bluebird'
import * as bcrypt from 'bcrypt'

export class PasswordHasher {
    private saltWorkFactor : number

    constructor({saltWorkFactor} : {saltWorkFactor : number}) {
        this.saltWorkFactor = saltWorkFactor
    }

    async hash(password : string) {
        const hash = await bcrypt.hash(password, this.saltWorkFactor)
        return hash
    }

    async compare({password, hash} : {password : string, hash : string}) : Promise<boolean> {
        return await bcrypt.compare(password, hash)
    }
}