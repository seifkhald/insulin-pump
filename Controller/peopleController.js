const peopleClass = require('../Classes/peopleClass');

const login = async (req, res) => {
    try {
        const data = req.body;
        const result = await peopleClass.login(data);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    login,
    
};