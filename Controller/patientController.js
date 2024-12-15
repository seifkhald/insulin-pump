const Patient= require('../models/patients');
const patientClass = require('../Classes/patientClass')


const register = async (req,res) => {
    try{
        const data = req.body
        const result = await patientClass.register(data)
        res.status(201).json(result)
    }catch(error){
        res.status(400).json({message: error.message})
    }
}


const deleteProfile = async (req,res) => {
    try{
        const data = req.body
        const result = await patientClass.deleteProfile(data)
        res.status(201).json(result)
    }catch(error){
        res.status(400).json({message: error.message})
    }
}



const replace_reservoir = async (req, res) => {
    try {
        const data = req.body;
        const result = await patientClass.replace_reservoir(data);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};


const edit_Profile = async (req, res) => {
    try {
        const data = req.body;
        const result = await patientClass.edit_Profile(data);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};


const reset_device = async (req, res) => {
    try {
        const data = req.body;
        const result = await patientClass.reset_device(data);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const contact_support = async (req, res) => {
    try {
        const data = req.body;
        const result = await patientClass.contact_support(data);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};


const check_reservoir_quantity = async (req, res) => {
    try {
        const data = req.body;
        const result = await patientClass.check_reservoir_quantity(data);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};



const view_history = async (req, res) => {
    try {
        const data = req.body;
        const result = await patientClass.view_history(data);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const viewBloodSugarHistory = async (req, res) => {
    try {
        const data = req.body;
        const result = await patientClass.viewBloodSugarHistory(data);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};










module.exports = {
    register,
    deleteProfile,
    replace_reservoir,
    edit_Profile,
    reset_device,
    contact_support,
    check_reservoir_quantity,
    view_history,
    viewBloodSugarHistory
    

}