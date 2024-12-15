const TimeController = require('../Classes/TimeController');
const Notification = require('../models/notification');

const start_system = async (req, res) => {
    try {
        await TimeController.startSystem();
        res.status(200).json({
            message: 'System monitoring started',
            startedAt: new Date()
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const stop_system = async (req, res) => {
    try {
        TimeController.stopSystem();
        res.status(200).json({
            message: 'System monitoring stopped',
            stoppedAt: new Date()
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const get_notifications = async (req, res) => {
    try {
        const notifications = await Notification.findAll({
            where: { status: 'unread' },
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            message: 'Notifications retrieved successfully',
            notifications: notifications
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    start_system,
    stop_system,
    get_notifications
};