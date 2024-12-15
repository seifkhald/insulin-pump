const { Sequelize, DataTypes, Model } = require('sequelize');
const db = require('../database/db_connection');
const Patient = require('./patients');
const Admin = require('./admin');

class SupportMessage extends Model {}

SupportMessage.init({
    ID: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    patientID: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Patients',
            key: 'personID'
        },
        onDelete: 'CASCADE'
    },
    adminID: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'Admins',
            key: 'personID'
        },
        onDelete: 'SET NULL'
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'in-progress', 'resolved'),
        defaultValue: 'pending'
    }
}, {
    sequelize: db.Connector,
    modelName: 'SupportMessage',
    timestamps: true,
});

// Add associations
SupportMessage.belongsTo(Patient, {
    foreignKey: 'patientID',
    targetKey: 'personID'
});

SupportMessage.belongsTo(Admin, {
    foreignKey: 'adminID',
    targetKey: 'personID'
});

module.exports = SupportMessage;