import * as bluebird from 'bluebird'
const bcrypt = bluebird.promisifyAll(require('bcryptjs'))
// const crypto = bluebird.promisifyAll(require('crypto'))
import { Strategy as LocalStrategy } from 'passport-local'
import { UserStorage } from '../../components/storage/modules/auth'

export function createLocalStrategy({userStorage, saltWorkFactor} : {userStorage : UserStorage, saltWorkFactor : number}) {
    return new new LocalStrategy(async (id, password, done) => {
        try {
            const user = await userStorage.findByIdentifier(id)
            const isMatch = await bcrypt.compareAsync(password, user.passwordHash)
            if (isMatch) {
                done(null, user)
            } else {
                done(null, false, {message: 'Incorrect email or password'})
            }
        } catch (err) {
            done(err)
        }
    })
}

export function hash(user, saltWorkFactor) {
    if (!user.password) throw new Error('No password provided');
    return bcrypt
        .genSaltAsync(saltWorkFactor)
        .then(salt => bcrypt.hashAsync(user.password, salt))
        .then(hash => user.password = hash);
}

export function compare(user, password) {
    return bcrypt.compareAsync(password, user.password);
}