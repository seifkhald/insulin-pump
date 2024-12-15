const DeviceClass = require('../Classes/DeviceClass');
const Device = require('../models/device');
const Patient = require('../models/patients');
const scheduler = require('../Classes/SchedulerClass');

const deviceController = {
    startMonitoring: async (req, res) => {
        try {
            const { patientID } = req.body;

            
            const patient = await Patient.findByPk(patientID);
            if (!patient) {
                return res.status(404).json({
                    success: false,
                    message: 'Patient not found'
                });
            }

            
            const device = await Device.findOne({
                where: { patientID: patientID }
            });
            if (!device) {
                return res.status(404).json({
                    success: false,
                    message: 'No device found for this patient'
                });
            }

            
            const deviceInstance = new DeviceClass({
                id: device.id,
                patientID: device.patientID,
                reservoirCapacity: device.reservoirCapacity,
                batteryLife: device.batteryLife,
                history: device.history,
                status: device.status,
                lastDose: device.lastDose,
                currentBloodSugar: device.currentBloodSugar,
                instantMeasure: device.instantMeasure,
                previousMeasure: device.previousMeasure,
                display: device.display
            });

            
            scheduler.startDeviceMeasurements(device.id);

            res.status(200).json({
                success: true,
                message: 'Device monitoring started',
                deviceId: device.id,
                deviceStatus: {
                    reservoirCapacity: device.reservoirCapacity,
                    batteryLife: device.batteryLife,
                    status: device.status,
                    currentBloodSugar: device.currentBloodSugar
                }
            });

        } catch (error) {
            console.error('Error starting device monitoring:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to start device monitoring',
                error: error.message
            });
        }
    }
};

module.exports = deviceController;