const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Patient = require('../models/patients');
const { Sequelize } = require('sequelize');
const device = require('./DeviceClass');
const Device = require('../models/device');
const People = require('../models/people');
const SupportMessage = require('../models/supportMessages');



class patientClass{
    constructor(firstName,lastName,Email,password,patientAge,ID,role,device){
        this.ID = ID
        this.firstName = firstName
        this.lastName = lastName
        this.Email = Email
        this.password = password
        this.patientAge = patientAge
        this.device = device
        role = "patient"
    }




    static async register(data) {
        try {
            const { firstName, secondName, Email, password, patientAge, longitude, latitude } = data;

            const existingPerson = await People.findOne({
                where: {
                    email: Email.toLowerCase()
                }
            });

            if (existingPerson) {
                throw new Error('Email already registered');
            }

            const hashingPassword = await bcrypt.hash(password, 10);

            const newPerson = await People.create({
                email: Email.toLowerCase(),
                password: hashingPassword,
                role: 'patient'
            });

            const newPatient = await Patient.create({
                firstName: firstName,
                secondName: secondName,
                Email: Email.toLowerCase(),
                password: hashingPassword,
                patientAge: patientAge,
                longitude: longitude || null,
                latitude: latitude || null,
                role: "patient",
                personID: newPerson.ID
            });

            const newDevice = await Device.create({
                reservoirCapacity: 120,
                batteryLife: 100,
                patientID: newPatient.personID,
                status: 'active',
                lastDose: 0,
                currentBloodSugar: 0,
                instantMeasure: 0,
                previousMeasure: 0,
                display: {
                    isOn: true,
                    brightness: 100,
                    lastUpdate: new Date()
                }
            });

            return {
                message: 'Patient registration successful',
                patient: {
                    personID: newPatient.personID,
                    firstName: newPatient.firstName,
                    secondName: newPatient.secondName,
                    Email: newPatient.Email,
                    patientAge: newPatient.patientAge,
                    longitude: newPatient.longitude,
                    latitude: newPatient.latitude
                },
                device: newDevice.id
            };

        } catch (error) {
            if (error.name === 'SequelizeUniqueConstraintError') {
                throw new Error('Email already registered');
            }
            console.error('Registration error:', error);
            throw new Error(error.message || 'Error in the registration process');
        }
    }



//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


    static async deleteProfile(data) {
        try {
            const { personID } = data;  // Changed from ID to personID

            if (!personID) {
                throw new Error("Patient ID is required");
            }

            const patient = await Patient.findOne({
                where: { personID: personID }  // Changed to match the model
            });

            if (!patient) {
            throw new Error("Patient not found");
        }

        // Delete associated device first
            await Device.destroy({
                where: { patientID: personID }
            });

        // Delete patient record
            await patient.destroy();

            return {
                message: `Profile for patient with ID ${personID} has been deleted successfully.`,
                deletedPatientID: personID
            };
        } catch (error) {
            console.error("Error in deleting profile:", error);
            throw new Error(`Error in deleting profile: ${error.message}`);
        }
    }

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


    static async replace_reservoir(data) {
        try {
            const { personID, deviceID } = data;

            const patientDevice = await Device.findOne({
                where: {
                    id: deviceID,
                    patientID: personID
                }
            });

            if (!patientDevice) {
                throw new Error("No matching device found for this patient");
            }

            const historyEntry = `Reservoir replaced at ${new Date().toISOString()}. New capacity: 100%`;

            let currentHistory = [];
            if (patientDevice.history) {
                currentHistory = Array.isArray(patientDevice.history)
                    ? patientDevice.history
                    : [];
            }

            await patientDevice.update({
                reservoirCapacity: 100,
                history: [...currentHistory, historyEntry]
            });

            return {
                message: "Reservoir replaced successfully",
                details: {
                    patientID: personID,
                    deviceID: deviceID,
                    newReservoirCapacity: 100,
                    timestamp: new Date(),
                    historyEntry: historyEntry
                }
            };
        } catch (error) {
            console.error("Error in replacing reservoir:", error);
            throw new Error(`Error in replacing reservoir: ${error.message}`);
        }
    }

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


static async edit_Profile(data) {
    try {
        const { ID, ...updateData } = data;

        if (!ID) {
            throw new Error("Patient ID is required");
        }

        const patient = await Patient.findOne({
            where: { personID: ID }
        });

        if (!patient) {
            throw new Error("Patient not found");
        }

        const patientDevice = await Device.findOne({
            where: {
                patientID: ID
            }
        });

        if (!patientDevice) {
            throw new Error("No device found for this patient");
        }

        const validUpdates = {};
        const allowedFields = ['firstName', 'secondName', 'Email', 'patientAge', 'longitude', 'latitude'];

        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) {
                validUpdates[field] = updateData[field];
            }
        });

        if (validUpdates.Email) {
            const existingEmail = await Patient.findOne({
                where: {
                    Email: validUpdates.Email,
                    personID: { [Sequelize.Op.ne]: ID }
                }
            });
            if (existingEmail) {
                throw new Error("Email already in use");
            }
        }

        const historyEntry = `Profile updated at ${new Date().toISOString()}. Updated fields: ${Object.keys(validUpdates).join(', ')}`;

        await patient.update(validUpdates);

        await patientDevice.update({
            history: [...(patientDevice.history || []), historyEntry]
        });

        return {
            message: "Profile updated successfully",
            details: {
                patientID: ID,
                updatedFields: Object.keys(validUpdates),
                timestamp: new Date(),
                historyEntry: historyEntry
            }
        };
    } catch (error) {
        console.error("Error in editing profile:", error);
        throw new Error(`Error in editing profile: ${error.message}`);
    }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


static async reset_device(data) {
    try {
        const { personID, deviceID } = data;

        const patientDevice = await Device.findOne({
            where: {
                id: deviceID,
                patientID: personID
            }
        });

        if (!patientDevice) {
            throw new Error("No matching device found for this patient");
        }

        await patientDevice.update({
            reservoirCapacity: 120,
            batteryLife: 100,
            history: []
        });

        return {
            message: "Device reset successfully",
            details: {
                patientID: personID,
                deviceID: deviceID,
                resetTimestamp: new Date(),
                newValues: {
                    reservoirCapacity: 120,
                    batteryLife: 100
                }
            }
        };
    } catch (error) {
        throw new Error(`Error in resetting device: ${error.message}`);
    }
}



///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



static async contact_support(data) {
    try {
        const { Email, message, adminID } = data;

        const patient = await Patient.findOne({
            where: { Email: Email }
        });

        if (!patient) {
            throw new Error("Patient not found");
        }

        if (adminID) {
            const admin = await Admin.findOne({
                where: { personID: adminID }
            });
            if (!admin) {
                throw new Error("Admin not found");
            }
        }

        const supportMessage = await SupportMessage.create({
            patientID: patient.personID,
            adminID: adminID || null,
            message: message,
            status: 'pending'
        });

        return {
            message: "Support message sent successfully",
            details: {
                messageID: supportMessage.id,
                patientEmail: Email,
                adminID: adminID || 'Not assigned',
                status: 'pending',
                timestamp: supportMessage.createdAt,
                estimatedResponse: "Within 24 hours"
            }
        };

    } catch (error) {
        console.error("Error in contacting support:", error);
        throw new Error(`Error in contacting support: ${error.message}`);
    }
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


static async check_reservoir_quantity(data) {
    try {
        const { personID, deviceID } = data;

        const patientDevice = await Device.findOne({
            where: {
                id: deviceID,
                patientID: personID
            }
        });

        if (!patientDevice) {
            throw new Error("No matching device found for this patient");
        }

        let status;
        if (patientDevice.reservoirCapacity >= 75) {
            status = "Good";
        } else if (patientDevice.reservoirCapacity >= 25) {
            status = "Medium";
        } else {
            status = "Low - Please refill soon";
        }

        const historyEntry = `Reservoir checked at ${new Date().toISOString()}. Status: ${status}, Level: ${patientDevice.reservoirCapacity}%`;

        await patientDevice.update({
            history: [...(patientDevice.history || []), historyEntry]
        });

        return {
            message: "Reservoir quantity retrieved successfully",
            details: {
                patientID: personID,
                deviceID: deviceID,
                currentQuantity: patientDevice.reservoirCapacity,
                status: status,
                maxCapacity: 120,
                lastChecked: new Date(),
                historyEntry: historyEntry
            }
        };
    } catch (error) {
        throw new Error(`Error in checking reservoir quantity: ${error.message}`);
    }
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


static async view_history(data) {
    try {
        const { personID, deviceID } = data;

        // Find the patient and include their device information
        const patient = await Patient.findOne({
            where: { personID: personID },
            attributes: ['firstName', 'secondName', 'Email', 'patientAge'],
            include: [{
                model: Device,
                where: { id: deviceID },
                attributes: [
                    'id',
                    'reservoirCapacity',
                    'batteryLife',
                    'status',
                    'lastDose',
                    'currentBloodSugar',
                    'instantMeasure',
                    'previousMeasure',
                    'history',
                    'display'
                ]
            }]
        });

        if (!patient) {
            throw new Error("Patient not found");
        }

        if (!patient.Device) {
            throw new Error("No device found for this patient");
        }

        return {
            message: "Device history retrieved successfully",
            details: {
                patient: {
                    name: `${patient.firstName} ${patient.secondName}`,
                    email: patient.Email,
                    age: patient.patientAge
                },
                device: {
                    id: patient.Device.id,
                    currentStatus: {
                        reservoirCapacity: patient.Device.reservoirCapacity,
                        batteryLife: patient.Device.batteryLife,
                        status: patient.Device.status,
                        lastDose: patient.Device.lastDose,
                        currentBloodSugar: patient.Device.currentBloodSugar,
                        instantMeasure: patient.Device.instantMeasure,
                        previousMeasure: patient.Device.previousMeasure
                    },
                    display: patient.Device.display,
                    history: patient.Device.history.map(entry => ({
                        ...entry,
                        timestamp: new Date(entry.timestamp || entry.date).toISOString()
                    })).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                }
            }
        };
    } catch (error) {
        throw new Error(`Error in viewing history: ${error.message}`);
    }
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////











}

module.exports = patientClass
