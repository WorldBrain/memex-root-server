import * as fs from 'fs'
import * as path from 'path'
import * as nodemailer from 'nodemailer'

export interface Mailer {
    send(mail) : Promise<any>
}

export class NodeMailer {
    private transport : nodemailer.Transporter

    constructor(transportConfig) {
        this.transport = nodemailer.createTransport(transportConfig)
    }

    async send(message) {
        return new Promise((resolve, reject) => {
            this.transport.sendMail(message, (err) => err ? reject(err) : resolve())
        })
    }
}

export class FilesystemMailer {
    constructor(public basePath) {
    }

    async send(message) {
        const filePath = path.join(this.basePath, `mail_${Date.now()}.json`)
        fs.writeFileSync(filePath, JSON.stringify(message, null, 4))
    }
}
