const RedisService = require('../services/redisService');
const DeviceClass = require('./DeviceClass');

class SchedulerClass {
    constructor() {
        this.intervals = new Map();
    }

    async startDeviceMeasurements(deviceId) {
        if (this.intervals.has(deviceId)) {
            console.log(`Device ${deviceId} is already being monitored`);
            return;
        }

        // Initial measurement
        try {
            // Take initial measurement
            const initialMeasurement = await DeviceClass.MeasureBloodSuger({ deviceId });
            
            // Store in Redis
            await RedisService.storeBloodSugarMeasurements(
                deviceId,
                initialMeasurement.bloodSugar
            );

            // Start periodic measurements
            const intervalId = setInterval(async () => {
                try {
                    // Take measurement
                    const measurement = await DeviceClass.MeasureBloodSuger({ deviceId });
                    
                    // Store in Redis
                    await RedisService.storeBloodSugarMeasurements(
                        deviceId,
                        measurement.bloodSugar
                    );

                } catch (error) {
                    console.error(`Error in measurement cycle for device ${deviceId}:`, error);
                }
            }, 600000); // 10 minutes

            this.intervals.set(deviceId, intervalId);
            console.log(`Started monitoring device ${deviceId}`);

        } catch (error) {
            console.error(`Error starting measurements for device ${deviceId}:`, error);
            throw error;
        }
    }

    stopDeviceMeasurements(deviceId) {
        const intervalId = this.intervals.get(deviceId);
        if (intervalId) {
            clearInterval(intervalId);
            this.intervals.delete(deviceId);
            console.log(`Stopped monitoring device ${deviceId}`);
        }
    }

    getMonitoredDevices() {
        return Array.from(this.intervals.keys());
    }

    stopAllMeasurements() {
        this.intervals.forEach((intervalId, deviceId) => {
            clearInterval(intervalId);
            console.log(`Stopped monitoring device ${deviceId}`);
        });
        this.intervals.clear();
    }
}

const scheduler = new SchedulerClass();
module.exports = scheduler;