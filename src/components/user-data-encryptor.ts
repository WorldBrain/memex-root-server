// Encrypts and decrypts data that is meant to be stored encrypted on the client-side, but used server-side
// User has access to encrypted data, so don't put data in their that brings high risk if the user tampers with it
// Current use case: storing their Google Drive refresh tokens
const crypto = require('crypto')

export class UserDataEncrypter {
    private algorithm : string = 'aes256'

    constructor(private secret : string) { // secret needs to be 16 bytes
    }

    async encrypt(data : string) : Promise<string> {
        const iv = crypto.randomBytes(16)
        const cipher = crypto.createCipheriv(
            this.algorithm,
            this.secret,
            iv
        )
        const encrypted = [
            iv.toString('hex'),
            ':',
            cipher.update(data, 'utf8', 'hex'),
            cipher.final('hex')
        ]

        return encrypted.join('')
    }

    async decrypt(encryptedData : string) {
        const encryptedArray = encryptedData.split(':')
        const iv = new Buffer(encryptedArray[0], 'hex')
        const encrypted = new Buffer(encryptedArray[1], 'hex')
        const decipher = crypto.createDecipheriv(this.algorithm, this.secret, iv)
        const data = decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8')

        return data
    }
}
