const roleCheck = (allowedRoles) => {
    return (req, res, next) => {
        try {

            if (!req.user || !req.user.role) {
                return res.status(401).json({
                    success: false,
                    message: 'User role not found'
                });
            }

            if (!allowedRoles.includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
                });
            }

            next();
        } catch (error) {
            console.error('Role check error:', error);
            res.status(500).json({
                success: false,
                message: 'Error checking role permissions'
            });
        }
    };
};

module.exports = roleCheck;