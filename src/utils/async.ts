const _ = require('lodash')

export async function asyncMapValues(obj, f) {
    const mapped = {}
    await Promise.all(_.map(obj, async (val, key) => {
        mapped[key] = await f(val, key)
    }))
    return mapped
}
