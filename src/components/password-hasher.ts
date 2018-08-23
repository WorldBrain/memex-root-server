import * as bluebird from 'bluebird'
import * as bcrypt from 'bcryptjs'

export class PasswordHasher {
    private saltWorkFactor : number

    constructor({saltWorkFactor} : {saltWorkFactor : number}) {
        this.saltWorkFactor = saltWorkFactor
    }

    async hash(password : string) {
        // return await new Promise((resolve, reject) => {
        //     bcrypt.hash('bacon', 8, function(err, hash) {
        //         err ? reject(err) : resolve(hash)
        //     })
        // })
        const hash = await bcrypt.hash(password, this.saltWorkFactor)
        return hash
    }

    async compare({password, hash} : {password : string, hash : string}) : Promise<boolean> {
        return await bcrypt.compare(password, hash)
    }
}