import { UserStorage } from '../../components/storage/modules/auth'
import { PasswordlessTokenStorage } from '../../components/storage/modules/passwordless'
import { Mailer } from '../../components/mailer'
import { EmailGenerator } from '../../components/email-generator'

export function authPasswordlessGenerateToken(
    {baseUrl, userStorage, passwordlessTokenStorage, mailer, emailGenerator} :
    {baseUrl : string, userStorage : UserStorage, passwordlessTokenStorage : PasswordlessTokenStorage, mailer : Mailer, emailGenerator : EmailGenerator}
) {
    return async ({email} : {email : string, password : string}) => {
        if (!await userStorage.findByIdentifier(`email:${email}`)) {
            return { success: false, error: 'unknown-email' }
        }

        try {
            const token = await passwordlessTokenStorage.createToken({email})
            
            await mailer.send({
                to: email,
                ...await emailGenerator.generateLoginEmail({
                    link: `https://static.memex.cloud/auth/login/finish?email=${encodeURIComponent(email)}&code=${token}`
                }),
            })
        } catch (err) {
            console.error(err)
            console.trace()
            return {success: false, error: 'internal'}
        }
            
        return { success: true, error: null }
    }
}
