const express = require('express');
const patientController = require('../Controller/patientController');
const peopleController = require('../Controller/peopleController');
const adminController = require('../Controller/adminController');
const timeController = require('../Controller/timeController');
const validateToken = require('../middleWare/TokenValidation');
const roleCheck = require('../middleWare/roleCheck');
const { validateUserRegistration } = require('../middleWare/UserValidation');
const deviceController = require('../Controller/deviceController');

const router = express.Router();

// Welcome route
router.get('', (req, res) => {
    res.status(200).send("Welcome to Dozak");
});

// Public routes
router.post("/register",  patientController.register);
router.post("/login", peopleController.login);

// Apply token validation to all routes below
router.use(validateToken);

// Patient routes
router.use('/patient', roleCheck(['patient']));
router.post("/patient/deleteProfile", patientController.deleteProfile);
router.post("/patient/replace_reservoir", patientController.replace_reservoir);
router.post("/patient/edit_Profile", patientController.edit_Profile);
router.post("/patient/reset_device", patientController.reset_device);
router.post("/patient/contact_support", patientController.contact_support);
router.post("/patient/check_reservoir_quantity", patientController.check_reservoir_quantity);
router.post("/patient/view_history", patientController.view_history);
router.post("/patient/view_blood_sugar_history", patientController.viewBloodSugarHistory);

// Admin routes
router.use('/admin', roleCheck(['admin']));
router.post("/admin/add_Patient", adminController.add_Patient);
router.post("/admin/delete_Patient", adminController.delete_Patient);
router.post("/admin/reset_patient_device", adminController.reset_patient_device);
router.post("/admin/generate_patient_report", adminController.generate_patient_report);
router.post("/admin/view_patient_history", adminController.view_patient_history);
router.post("/admin/edit_patient_profile", adminController.edit_patient_profile);
router.get("/admin/getAllPatient", adminController.getAllPatient);

// System control routes (admin only)
router.post("/admin/start_system", timeController.start_system);
router.post("/admin/stop_system", timeController.stop_system);

// Device routes
router.use('/device', roleCheck(['patient']));
router.post("/device/start_monitoring", deviceController.startMonitoring);

module.exports = router;