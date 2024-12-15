const { Sequelize, DataTypes, Model } = require('sequelize');
const db = require('../database/db_connection');
const People = require('./people');

class Admin extends Model {}

Admin.init({
    personID: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        unique: true,
        references: {
            model: People,
            key: 'ID'
        },
        onDelete: 'CASCADE'
    },
    Email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    sequelize: db.Connector,
    modelName: 'Admin',
    tableName: 'Admins',
    indexes: [
        {
            unique: true,
            fields: ['personID']
        }
    ],
    timestamps: true
});

Admin.belongsTo(People, {
    foreignKey: 'personID',
    targetKey: 'ID',
    onDelete: 'CASCADE'
});

module.exports = Admin;