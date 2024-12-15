const People = require("../models/people");

const validateUserRegistration = async (req, res, next) => {
    try {
        const { email, password, firstName, secondName } = req.body;

        // Check required fields
        if (!email || !password || !firstName || !secondName) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        // Check for existing email
        const existingPerson = await People.findOne({
            where: { email: email.toLowerCase() }
        });

        if (existingPerson) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Validate password
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
            return res.status(400).json({
                success: false,
                message: passwordValidation.errors.join(' ')
            });
        }

        next();
    } catch (error) {
        console.error('User validation error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error validating user data'
        });
    }
};

function validatePassword(password) {
    const errors = [];

    if (password.length < 8) {
        errors.push("Password must be at least 8 characters long.");
    }
    if (!/[A-Z]/.test(password)) {
        errors.push("Password must contain at least one uppercase letter.");
    }
    if (!/[a-z]/.test(password)) {
        errors.push("Password must contain at least one lowercase letter.");
    }
    if (!/[0-9]/.test(password)) {
        errors.push("Password must contain at least one number.");
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push("Password must contain at least one special character.");
    }

    return errors.length === 0 ? { valid: true } : { valid: false, errors };
}

module.exports = {
    validateUserRegistration,
    validatePassword
};