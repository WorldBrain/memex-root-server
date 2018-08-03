import { testStorageBackend } from "../../manager/index.test";
import { SequelizeStorageBackend } from ".";

describe('Sequelize StorageBackend integration tests', () => {
    testStorageBackend(async () => {
        return new SequelizeStorageBackend({sequelizeConfig: 'sqlite://'})
    })
})
