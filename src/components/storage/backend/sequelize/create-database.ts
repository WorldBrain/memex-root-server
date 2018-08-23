const { Client } = require('pg')

export async function createPostgresDatabaseIfNecessary(
    { host = null, port = null, username : user = null, password = null, database }
) {
    const client = new Client({ host, port, user, password, database: 'postgres' })

    let created
    try {
        await client.query(`CREATE DATABASE ${database}`)
        created = true
    } catch (err) {
        created = false
    }

    client.end()
    return created
}
