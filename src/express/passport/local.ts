// const crypto = bluebird.promisifyAll(require('crypto'))
import { Strategy as LocalStrategy } from 'passport-local'
import { UserStorage } from '../../components/storage/modules/auth'
import { PasswordHasher } from '../../components/password-hasher'

export function createLocalStrategy({userStorage, passwordHasher} : {userStorage : UserStorage, passwordHasher : PasswordHasher}) {
    return new LocalStrategy(async (email, password, done) => {
        try {
            console.log('ls authing!!')
            console.log('ls authing!!')
            console.log('ls authing!!')
            const user = await userStorage.findByIdentifier(`email:${email}`)
            if (!user) {
                done(new Error('User not found'))
            }

            const isMatch = await passwordHasher.compare({password, hash: user.passwordHash})
            console.log(email, password, user && user.passwordHash, isMatch)
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
