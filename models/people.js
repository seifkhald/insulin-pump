const { Sequelize, DataTypes, Model } = require('sequelize');
const db = require('../database/db_connection');

class People extends Model {}

People.init({
    ID: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: {
        isEmail: true,
        },
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    role: {
        type: DataTypes.ENUM('patient', 'admin'),
        allowNull: false,
    },
}, {
    sequelize: db.Connector,
    modelName: 'People',
    tableName: 'People',
    timestamps: true,
});

module.exports = People;
