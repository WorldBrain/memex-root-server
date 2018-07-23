import * as fs from 'fs'
import * as shell from 'shelljs'

export function mkdirSyncIfNotExists(path : string) {
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path)
    }
}

export function mkdirPathSync(path : string) {
    shell.mkdir('-p', path)
}
