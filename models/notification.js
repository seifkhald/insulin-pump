const { Sequelize, DataTypes, Model } = require('sequelize');
const db = require('../database/db_connection');

class Notification extends Model {}

Notification.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    deviceId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    patientId: {
        type: DataTypes.UUID,
        allowNull: true
    },
    message: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    notificationType: {
        type: DataTypes.ENUM('BLOOD_SUGAR_ALERT', 'INSULIN_DELIVERY', 'RESERVOIR_LOW', 'DEVICE_ERROR'),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('unread', 'read'),
        defaultValue: 'unread',
    },
    data: {
        type: DataTypes.JSON,
        allowNull: true
    },
}, {
    sequelize: db.Connector,
    modelName: 'Notification',
    timestamps: true,
});

module.exports = Notification;
