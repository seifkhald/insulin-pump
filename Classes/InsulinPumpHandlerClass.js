const RedisService = require('../services/redisService');
const EmailService = require('../services/emailService');
const Notification = require('../models/notification');

class InsulinPumpHandlerClass {
    static SAFE_MIN_BLOOD_SUGAR = 70;
    static SAFE_MAX_BLOOD_SUGAR = 180;

    static async getmeasurementData(deviceId) {
        const data = await RedisService.getBloodSugarMeasurements(deviceId);
        if (!data || data.length < 3) {  // Need at least 3 readings to calculate rate of change
            console.log('Not enough measurements yet:', data);
            return {
                currentReading: data ? data[data.length - 1] : null,
                shouldDeliverInsulin: false,
                timestamp: new Date(),
                metrics: {
                    currentRate: 0,
                    rateOfRateChange: 0,
                    isInSafeRange: true
                }
            };
        }

        // Get the last three measurements to calculate rate of change
        const latestReadings = data.slice(-3);
        const currentReading = latestReadings[2];
        const previousReading = latestReadings[1];
        const oldestReading = latestReadings[0];

        console.log('Blood Sugar Readings:', {
            current: currentReading,
            previous: previousReading,
            oldest: oldestReading
        });

        // Calculate rates of change
        const currentRate = currentReading - previousReading;
        const previousRate = previousReading - oldestReading;
        const rateOfRateChange = currentRate - previousRate;

        console.log('Rate Analysis:', {
            currentRate,
            previousRate,
            rateOfRateChange
        });

        let shouldDeliverInsulin = false;

        // Case 1: Below safe minimum
        if (currentReading < this.SAFE_MIN_BLOOD_SUGAR) {
            shouldDeliverInsulin = false;
            console.log('Blood sugar too low, no insulin needed');
        }
        // Case 2: Within safe zone but rising
        else if (currentReading >= this.SAFE_MIN_BLOOD_SUGAR && 
                 currentReading <= this.SAFE_MAX_BLOOD_SUGAR) {
            shouldDeliverInsulin = currentRate > 0;
            console.log('Within safe range, deliver insulin if rising:', shouldDeliverInsulin);
        }
        // Case 3: Above safe maximum
        else if (currentReading > this.SAFE_MAX_BLOOD_SUGAR) {
            shouldDeliverInsulin = true;
            console.log('Blood sugar too high, insulin needed');
        }

        const result = {
            currentReading,
            shouldDeliverInsulin,
            timestamp: new Date(),
            metrics: {
                currentRate,
                rateOfRateChange,
                isInSafeRange: currentReading >= this.SAFE_MIN_BLOOD_SUGAR && 
                            currentReading <= this.SAFE_MAX_BLOOD_SUGAR
            }
        };

        console.log('Analysis Result:', result);
        return result;
    }

    static async handleBloodSugarNotification(deviceId, patientEmail, patientId) {
        try {
            const measurementData = await this.getmeasurementData(deviceId);
            const currentReading = measurementData.currentReading;
            
            let notificationType = 'BLOOD_SUGAR_ALERT';
            let subject = '';
            let message = '';

            // Determine notification content based on blood sugar level
            if (currentReading < this.SAFE_MIN_BLOOD_SUGAR) {
                subject = '⚠️ Low Blood Sugar Alert';
                message = `Your blood sugar level is dangerously low at ${currentReading} mg/dL. 
                          Please consume fast-acting carbohydrates immediately and check your blood sugar again in 15 minutes.`;
            } 
            else if (currentReading > this.SAFE_MAX_BLOOD_SUGAR) {
                subject = '⚠️ High Blood Sugar Alert';
                message = `Your blood sugar level is high at ${currentReading} mg/dL. 
                          Insulin will be delivered automatically. Please monitor your levels closely.`;
            }
            else if (measurementData.metrics.currentRate > 10) {
                subject = '📈 Rapid Blood Sugar Increase Alert';
                message = `Your blood sugar is rising rapidly. Current level: ${currentReading} mg/dL. 
                          Rate of change: ${measurementData.metrics.currentRate} mg/dL per reading.`;
            }
            else {
                // No need to send notification for normal readings
                return;
            }

            // Send email notification
            await EmailService.sendNotificationEmail(
                patientEmail,
                subject,
                message
            );

            // Create notification record in database
            await Notification.create({
                deviceId,
                patientId,
                message,
                notificationType,
                data: {
                    bloodSugar: currentReading,
                    metrics: measurementData.metrics,
                    timestamp: measurementData.timestamp
                }
            });

            console.log('Blood sugar notification sent successfully');

        } catch (error) {
            console.error('Error handling blood sugar notification:', error);
            throw error;
        }
    }
}
module.exports = InsulinPumpHandlerClass;
