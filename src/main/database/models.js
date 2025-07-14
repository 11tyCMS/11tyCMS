const { Sequelize, DataTypes } = require('sequelize');
class CMSDatabase {
    constructor(sqliteDatabase) {
        this.db = sqliteDatabase;
        this.ItemMetadata = this.db.define('ItemMetadata', {
            id: {
                primaryKey: true,
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
            },
            collection: {
                type: DataTypes.STRING,
                allowNull: false
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false
            },
            path: {
                type: DataTypes.STRING,
                allowNull: false
            },
            parentPath: {
                type: DataTypes.STRING,
                allowNull: false
            },
            data: {
                type: DataTypes.JSON,
                allowNull: false
            }
            
        });
        this.db.sync()
    }
}
export {
    CMSDatabase
}