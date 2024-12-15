const { Sequelize, DataTypes, Model } = require('sequelize');
const db = require('../database/db_connection');
const People = require('./people');
const Device = require('./device');

class Patient extends Model {
    static associate(models) {
        Patient.hasOne(models.Device, {
            foreignKey: 'patientID',
            sourceKey: 'personID'
        });
    }
}

Patient.init(
{
    firstName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    secondName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    Email: {
        type: DataTypes.STRING,
        unique: true,
        validate: {
            isEmail: true,
        },
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    patientAge: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    longitude: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    latitude: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    role: {
        type: DataTypes.STRING,
    },
    personID: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey:true,
        references: {
            model: People,
            key: 'ID',
        },
        onDelete: 'CASCADE',
    },
},{
    sequelize: db.Connector,
    modelName: 'Patient',
    timestamps: true,
});

Patient.belongsTo(People, {
    foreignKey: 'personID',
    targetKey: 'ID',
});



module.exports = Patient;
