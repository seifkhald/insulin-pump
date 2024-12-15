const Device = require('../models/device');
const Patient = require('../models/patients');
const Notification = require('../models/notification');

class TimeController {
    constructor() {
        this.startTime = new Date();
        this.isRunning = false;
    }

    async startSystem() {
        if (!this.isRunning) {
            this.isRunning = true;
            console.log('System monitoring started:', new Date().toISOString());

            // Initial check
            await this.checkAllDevices();

            // Set up daily updates at midnight
            setInterval(async () => {
                await this.dailyUpdate();
            }, 24 * 60 * 60 * 1000);

            // Check devices every hour
            setInterval(async () => {
                await this.checkAllDevices();
            }, 60 * 60 * 1000);
        }
    }

    async dailyUpdate() {
        try {
            const devices = await Device.findAll({
                include: [{
                    model: Patient,
                    attributes: ['Email', 'firstName', 'secondName']
                }]
            });

            for (const device of devices) {
                const newBattery = Math.max(0, device.batteryLife - 5);
                const newReservoir = Math.max(0, device.reservoirCapacity - 10);

                const historyEntry = {
                    date: new Date(),
                    type: 'daily_update',
                    batteryLevel: newBattery,
                    reservoirLevel: newReservoir
                };

                await device.update({
                    batteryLife: newBattery,
                    reservoirCapacity: newReservoir,
                    history: [...(device.history || []), historyEntry]
                });
            }

            console.log('Daily update completed:', new Date().toISOString());
        } catch (error) {
            console.error('Daily update error:', error);
        }
    }

    async checkAllDevices() {
        try {
            const devices = await Device.findAll({
                include: [{
                    model: Patient,
                    attributes: ['Email', 'firstName', 'secondName']
                }]
            });

            for (const device of devices) {
                // Check battery level
                if (device.batteryLife < 20) {
                    await Notification.create({
                        message: `Low battery alert: ${device.batteryLife}% for patient ${device.Patient.firstName}`,
                        notificationType: 'error',
                        status: 'unread'
                    });
                }

                // Check reservoir level
                if (device.reservoirCapacity < 20) {
                    await Notification.create({
                        message: `Low reservoir alert: ${device.reservoirCapacity}% for patient ${device.Patient.firstName}`,
                        notificationType: 'warning',
                        status: 'unread'
                    });
                }
            }
        } catch (error) {
            console.error('Device check error:', error);
        }
    }

    stopSystem() {
        if (this.isRunning) {
            this.isRunning = false;
            console.log('System monitoring stopped:', new Date().toISOString());
        }
    }
}

module.exports = new TimeController();
