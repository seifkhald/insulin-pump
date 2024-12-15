const People = require('../models/people')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const Patient = require('../models/patients')
require('dotenv').config()

class peopleClass {
    constructor(email, password, role) {
        this.email = email;
        this.password = password;
        this.role = role;
    }

    static async login(data) {
        try {
            const { Email, password } = data;

            const person = await People.findOne({
                where: { email: Email.toLowerCase() }
            });

            if (!person) {
                throw new Error("User not found");
            }

            const validPassword = await bcrypt.compare(password, person.password);
            if (!validPassword) {
                throw new Error("Wrong password");
            }

            if (!process.env.JWT_SECRET) {
                throw new Error("JWT_SECRET is not configured");
            }

            const token = jwt.sign(
                {
                    id: person.ID,
                    email: person.email,
                    role: person.role
                },
                process.env.JWT_SECRET,
                { 
                    expiresIn: process.env.TOKEN_EXPIRATION || '24h',
                    algorithm: 'HS256'
                }
            );

            console.log('Token created successfully');

            return {
                message: "Login successful",
                token: token,
                user: {
                    id: person.ID,
                    email: person.email,
                    role: person.role
                }
            };
        } catch (error) {
            console.error('Login error:', error);
            throw new Error(error.message);
        }
    }


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////









}

module.exports = peopleClass;