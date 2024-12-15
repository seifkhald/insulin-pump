const { Sequelize, DataTypes, Model } = require('sequelize');
const db = require('../database/db_connection');

class Device extends Model {
    static associate(models) {
        Device.belongsTo(models.Patient, {
            foreignKey: 'patientID',
            targetKey: 'personID'
        });
    }
}

Device.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    patientID: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'Patients',
            key: 'personID',
        },
    },
    reservoirCapacity: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    batteryLife: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    history: {
        type: DataTypes.JSON,
        defaultValue: [],
        allowNull: true
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'active',
        allowNull: false
    },
    lastDose: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
        allowNull: false
    },
    currentBloodSugar: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
        allowNull: false
    },
    instantMeasure: {
        type: DataTypes.DOUBLE,
        defaultValue: 0,
        allowNull: false
    },
    previousMeasure: {
        type: DataTypes.DOUBLE,
        defaultValue: 0,
        allowNull: false
    },
    display: {
        type: DataTypes.JSON,
        defaultValue: {
            isOn: true,
            brightness: 100,
            lastUpdate: null
        }
    },
    bloodSugarHistory: {
        type: DataTypes.JSON,
        defaultValue: [],
        allowNull: true
    }
}, {
    sequelize: db.Connector,
    modelName: 'Device',
});

module.exports = Device;