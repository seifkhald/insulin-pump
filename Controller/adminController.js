const AdminClass = require('../Classes/adminClass');

const add_Patient = async (req, res) => {
    try {
        const data = req.body;
        const result = await AdminClass.add_patient(data);
        res.status(201).json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const delete_Patient = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const result = await AdminClass.delete_patient({ email });
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const reset_patient_device = async (req, res) => {
    try {
        const { email} = req.body;
        
        if (!email) {
            return res.status(400).json({ message: 'email is required' });
        }
        const result = await AdminClass.reset_patient_device({ email});
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const generate_patient_report = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const result = await AdminClass.generate_patient_report({ email });
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const view_patient_history = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const result = await AdminClass.view_patient_history({ email });
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const edit_patient_profile = async (req, res) => {
    try {
        const { email, firstName, secondName, patientAge, longitude, latitude } = req.body;
        
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const result = await AdminClass.edit_patient_profile({ 
            email, 
            firstName, 
            secondName, 
            patientAge, 
            longitude, 
            latitude 
        });
        
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
const getAllPatient = async (req, res) => {
    try {
        const result = await AdminClass.getAllPatients();
        res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching Patients:', error);
        res.status(500).json({ message: 'Error fetching patients' });
    }
};

module.exports = {
    add_Patient,
    delete_Patient,
    reset_patient_device,
    generate_patient_report,
    view_patient_history,
    edit_patient_profile,
    getAllPatient
};