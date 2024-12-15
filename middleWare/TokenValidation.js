const jwt = require('jsonwebtoken');
const RedisService = require('../services/redisService');
require('dotenv').config();

const validateToken = async (req, res, next) => {
    try {
        // Debug log
        console.log('JWT_SECRET available:', !!process.env.JWT_SECRET);

        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No token provided in Authorization header'
            });
        }

        const token = authHeader.split(' ')[1];
        
        // Debug log
        console.log('Token received:', token.substring(0, 20) + '...');

        // Check if JWT_SECRET is available
        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET is not configured');
            return res.status(500).json({
                success: false,
                message: 'Server configuration error'
            });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET, {
                algorithms: ['HS256'] // Explicitly specify the algorithm
            });

            req.user = {
                id: decoded.id,
                email: decoded.email,
                role: decoded.role
            };

            // Debug log
            console.log('Token verified successfully for user:', decoded.email);

            next();
        } catch (jwtError) {
            console.error('JWT Verification Error:', {
                name: jwtError.name,
                message: jwtError.message
            });

            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token has expired'
                });
            }

            return res.status(401).json({
                success: false,
                message: 'Invalid token format or signature'
            });
        }
    } catch (error) {
        console.error('Token validation error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error validating token'
        });
    }
};

module.exports = validateToken;

