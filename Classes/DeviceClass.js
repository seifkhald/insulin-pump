const { Sequelize } = require('sequelize');
const Device = require('../models/device');
const Patient = require('../models/patients');
const Notification = require('../models/notification');
const RedisService = require('../services/redisService');
const InsulinPumpHandlerClass = require('./InsulinPumpHandlerClass');

class DeviceClass {
    constructor({
        id,
        patientID,
        reservoirCapacity = 120,
        batteryLife = 100,
        history = [],
        status = 'active',
        lastDose = 0,
        currentBloodSugar = 0,
        instantMeasure = 0,
        previousMeasure = 0,
        display = {
            isOn: true,
            brightness: 100,
            lastUpdate: new Date()
        }
    }) {
        this.id = id;
        this.patientID = patientID;
        this.reservoirCapacity = reservoirCapacity;
        this.batteryLife = batteryLife;
        this.history = history;
        this.status = status;
        this.lastDose = lastDose;
        this.currentBloodSugar = currentBloodSugar;
        this.instantMeasure = instantMeasure;
        this.previousMeasure = previousMeasure;
        this.display = display;

        this.startMonitoring();
    }

    static async MeasureBloodSuger(data) {
        try {
            const { deviceId } = data;
            const device = await Device.findByPk(deviceId);
    
            if (!device) {
                throw new Error('Device not found');
            }

            const newBloodSugar = Math.floor(Math.random() * (180 - 70 + 1)) + 70;

            await RedisService.storeBloodSugarMeasurements(
                deviceId,
                newBloodSugar
            );
    
            return {
                success: true,
                bloodSugar: newBloodSugar,
                deviceId: deviceId,
                timestamp: Date.now()
            };
    
        } catch (error) {
            console.error('Error measuring blood sugar:', error);
            throw error;
        }
    }

    async startMonitoring() {
        setInterval(async () => {
            try {
                const measurementResult = await DeviceClass.MeasureBloodSuger({
                    deviceId: this.id
                });

                const analysisResult = await InsulinPumpHandlerClass.getmeasurementData(this.id);

                if (analysisResult && analysisResult.shouldDeliverInsulin) {
                    await this.deliverInsulin(analysisResult);
                }

                await this.updateStatus(analysisResult);

            } catch (error) {
                console.error('Monitoring error:', error);
            }
        }, 3* 60 * 1000); 
    }

    async deliverInsulin(analysisResult) {
        
        const insulinDose = this.calculateInsulinDose(analysisResult);
        
        
        if (this.reservoirCapacity < insulinDose) {
            
            await Notification.create({
                deviceId: this.id,
                patientId: this.patientID,
                notificationType: 'RESERVOIR_LOW',
                message: `Unable to deliver insulin: Reservoir too low (${this.reservoirCapacity}u remaining)`,
                priority: 'HIGH'
            });
            return;
        }

        
        this.lastDose = insulinDose;
        this.reservoirCapacity -= insulinDose;
        
        
        await Device.update({
            lastDose: this.lastDose,
            reservoirCapacity: this.reservoirCapacity
        }, {
            where: { id: this.id }
        });

        
        await Notification.create({
            deviceId: this.id,
            patientId: this.patientID,
            notificationType: 'INSULIN_DELIVERY',
            message: `Insulin dose of ${insulinDose}u delivered. Reservoir: ${this.reservoirCapacity}u remaining`,
            data: {
                dose: insulinDose,
                bloodSugar: analysisResult.currentReading,
                timestamp: new Date(),
                reservoirRemaining: this.reservoirCapacity
            }
        });
    }

    async updateStatus(analysisResult) {
        
        if (!analysisResult.metrics.isInSafeRange) {
            await Notification.create({
                deviceId: this.id,
                patientId: this.patientID,
                notificationType: 'BLOOD_SUGAR_ALERT',
                message: `Blood sugar level outside safe range: ${analysisResult.currentReading}`,
                priority: 'HIGH'
            });
        }

        
        await Device.update({
            currentBloodSugar: analysisResult.currentReading,
            status: this.status
        }, {
            where: { id: this.id }
        });
    }

    calculateInsulinDose(analysisResult) {
        const baseInsulinDose = 1.0;
        const bloodSugarFactor = (analysisResult.currentReading - 120) / 40;
        return Math.max(0, baseInsulinDose + bloodSugarFactor);
    }
}

module.exports = DeviceClass;
