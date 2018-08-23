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
            return { success: false }
        }

        const token = await passwordlessTokenStorage.createToken({email})
        
        await mailer.send({
            to: email,
            ...await emailGenerator.generateLoginEmail({
                link: `${baseUrl}/email/verify?code=${token}`
            }),
        })

        return { success: true }
    }
}
