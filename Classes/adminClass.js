const bcrypt = require('bcrypt');
const { Sequelize } = require('sequelize');
const People = require('../models/people');
const Patient = require('../models/patients');
const Device = require('../models/device');
const SupportMessage = require('../models/supportMessages');
const jwt = require('jsonwebtoken');
const RedisService = require('../services/redisService')





class AdminClass {
    constructor({ Email, password }) {
        this.Email = Email;
        this.password = password;
        this.role = "admin";
    }


    static async add_patient(data) {
        try {
            const { firstName, secondName, Email, password, patientAge } = data;

            const existingPerson = await People.findOne({ where: { email: Email } });
            if (existingPerson) {
                throw new Error('Email already registered');
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const newPerson = await People.create({
                email: Email.toLowerCase(),
                password: hashedPassword,
                role: 'patient'
            });

            const newPatient = await Patient.create({
                firstName,
                secondName,
                Email,
                password: hashedPassword,
                patientAge,
                personID: newPerson.ID,
                role: 'patient'
            });

            const newDevice = await Device.create({
                reservoirCapacity: 120,
                batteryLife: 100,
                patientID: newPatient.personID
            });

            return {
                message: 'Patient added successfully',
                patient: {
                    personID: newPatient.personID,
                    firstName: newPatient.firstName,
                    secondName: newPatient.secondName,
                    Email: newPatient.Email,
                    patientAge: newPatient.patientAge
                },
                device: newDevice.id
            };

        } catch (error) {
            console.error('Error adding patient:', error);
            throw new Error(error.message || 'Error in adding patient');
        }
    }

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



    static async delete_patient(data) {
        try {
            const { email } = data;

            const person = await People.findOne({
                where: { email: email.toLowerCase() }
            });

            if (!person) {
                throw new Error('Patient not found');
            }

            if (person.role !== 'patient') {
                throw new Error('Specified email does not belong to a patient');
            }

            await Device.destroy({
                where: { patientID: person.ID }
            });

            await People.destroy({
                where: { ID: person.ID }
            });

            return {
                message: 'Patient deleted successfully',
                details: {
                    email: email,
                    deletedAt: new Date()
                }
            };

        } catch (error) {
            console.error('Error deleting patient:', error);
            throw new Error(error.message || 'Error in deleting patient');
        }
    }

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    static async reset_patient_device(data) {
        try {
            const { email } = data;

            const patient = await Patient.findOne({
                where: { Email: email }
            });

            if (!patient) {
                throw new Error("Patient not found");
            }

            const device = await Device.findOne({
                where: { patientID: patient.personID }
            });

            if (!device) {
                throw new Error("Device not found");
            }

            await device.update({
                reservoirCapacity: 120,
                batteryLife: 100,
                history: []
            });

            return {
                message: "Device reset successfully",
                details: {
                    deviceID: device.id,
                    patientEmail: email,
                    resetTimestamp: new Date(),
                    newValues: {
                        reservoirCapacity: 120,
                        batteryLife: 100
                    }
                }
            };

        } catch (error) {
            console.error("Error in resetting device:", error);
            throw new Error(`Error in resetting device: ${error.message}`);
        }
    }

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    static async generate_patient_report(data) {
        try {
            const { email } = data;
            const fs = require('fs').promises;
            const path = require('path');

            const patient = await Patient.findOne({
                where: { Email: email },
                include: [{
                    model: Device,
                    required: false,
                    attributes: ['id', 'reservoirCapacity', 'batteryLife', 'history']
                }]
            });

            if (!patient) {
                throw new Error("Patient not found");
            }

            const reportContent = `
PATIENT REPORT
Generated on: ${new Date().toLocaleString()}
------------------------------------------

PATIENT DETAILS
--------------
Name: ${patient.firstName} ${patient.secondName}
Email: ${patient.Email}
Age: ${patient.patientAge}
Patient ID: ${patient.personID}
Location: ${patient.latitude ? `${patient.latitude}, ${patient.longitude}` : 'Not specified'}

DEVICE INFORMATION
-----------------
Device ID: ${patient.Device ? patient.Device.id : 'No device'}
Current Reservoir Capacity: ${patient.Device ? patient.Device.reservoirCapacity : 'N/A'}%
Current Battery Life: ${patient.Device ? patient.Device.batteryLife : 'N/A'}%

DEVICE HISTORY
-------------
${patient.Device && patient.Device.history ?
    patient.Device.history.join('\n')
    : 'No history available'}
`;

            const reportsDir = path.join(__dirname, '../reports');
            await fs.mkdir(reportsDir, { recursive: true });

            const filename = `patient_report_${patient.firstName}_${patient.secondName}_${Date.now()}.txt`;
            const filepath = path.join(reportsDir, filename);

            await fs.writeFile(filepath, reportContent, 'utf8');

            return {
                message: "Patient report generated successfully",
                details: {
                    patientEmail: email,
                    reportFile: filename,
                    generatedAt: new Date(),
                    filePath: filepath
                }
            };

        } catch (error) {
            console.error("Error generating patient report:", error);
            throw new Error(`Error generating patient report: ${error.message}`);
        }
    }





////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    static async view_patient_history(data) {
        try {
            const { email } = data;

            const patient = await Patient.findOne({
                where: { Email: email },
                include: [{
                    model: Device,
                    required: false,
                    attributes: ['id', 'reservoirCapacity', 'batteryLife', 'history']
                }]
            });

            if (!patient) {
                throw new Error("Patient not found");
            }

            if (!patient.Device) {
                throw new Error("No device found for this patient");
            }

            return {
                message: "Patient history retrieved successfully",
                details: {
                    patient: {
                        firstName: patient.firstName,
                        secondName: patient.secondName,
                        email: patient.Email,
                        patientAge: patient.patientAge
                    },
                    device: {
                        id: patient.Device.id,
                        currentStatus: {
                            reservoirCapacity: patient.Device.reservoirCapacity,
                            batteryLife: patient.Device.batteryLife
                        },
                        history: patient.Device.history || []
                    }
                }
            };

        } catch (error) {
            console.error("Error viewing patient history:", error);
            throw new Error(`Error viewing patient history: ${error.message}`);
        }
    }




//////////////////////////////////////////////////////////////////////////////////////////////





    static async edit_patient_profile(data) {
        try {
            const { email, firstName, secondName, patientAge, longitude, latitude } = data;

            const patient = await Patient.findOne({
                where: { Email: email }
            });

            if (!patient) {
                throw new Error("Patient not found");
            }

            const validUpdates = {};
            if (firstName) validUpdates.firstName = firstName;
            if (secondName) validUpdates.secondName = secondName;
            if (patientAge) validUpdates.patientAge = patientAge;
            if (longitude) validUpdates.longitude = longitude;
            if (latitude) validUpdates.latitude = latitude;

            await patient.update(validUpdates);

            return {
                message: "Patient profile updated successfully",
                details: {
                    email: patient.Email,
                    updatedFields: Object.keys(validUpdates),
                    updatedAt: new Date(),
                    newProfile: {
                        firstName: patient.firstName,
                        secondName: patient.secondName,
                        patientAge: patient.patientAge,
                        location: {
                            longitude: patient.longitude,
                            latitude: patient.latitude
                        }
                    }
                }
            };

        } catch (error) {
            console.error("Error editing patient profile:", error);
            throw new Error(`Error editing patient profile: ${error.message}`);
        }
    }


/////////////////////////////////////////////////////////////////////////////////////////

static async getAllPatients() {
    try {
        const cachedData = await RedisService.getCachedPatients();
        if (cachedData) {
            return {
                message: 'Patients retrieved successfully',
                ...cachedData
            };
        }
        const patients = await People.findAll({
            where: { role: 'patient' },
            attributes: ['ID', 'email', 'role', 'createdAt', 'updatedAt'],
            order: [['createdAt', 'DESC']]
        });

        const timestamp = await RedisService.cachePatients(patients);

        return {
            message: 'patients retrieved successfully',
            patients: patients,
            lastUpdate: timestamp,
            fromCache: false
        };
    } catch (error) {
        console.error('Error in getAllPatients:', error);
        throw error;
    }
}









}





module.exports = AdminClass;
