import { AppComponents } from '../components'
import { AppControllers } from '../controllers'
import { DevShortcutList } from './types'

export async function createUser({components} : {components : AppComponents}) {
    const email = 'foo@foo.com', password = 'foobar'
    console.log("Creating test user '%s' with password '%s'", email, password)
    await components.storage.users.registerUser({ email, passwordHash: await components.passwordHasher.hash(password), active: true })
}

export async function createLoginCode({components} : {components : AppComponents}) {
    const email = 'foo@foo.com', tokenString = 'foobar'
    console.log("Creating code user '%s' = '%s'", email, tokenString)
    await components.storage.passwordless.createToken({email, tokenString})
}

export default <DevShortcutList>[
    {handler: createUser},
    {handler: createLoginCode},
]
