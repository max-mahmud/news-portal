const jwt = require('jsonwebtoken');

class Middleware {
    async auth(req, res, next) {
        const { authorization } = req.headers;

        if (authorization && authorization.startsWith('Bearer ')) {
            const token = authorization.split('Bearer ')[1];
            if (token) {
                try {
                    const userInfo = await jwt.verify(token, process.env.SECRET);
                    req.userInfo = userInfo;
                    return next();
                } catch (error) {
                    return res.status(401).json({ message: "Invalid or expired token" });
                }
            }
        }
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    async role(req, res, next) {
        const { userInfo } = req;
        if (userInfo && userInfo.role === 'admin') {
            return next();
        } else {
            return res.status(403).json({ message: "Forbidden: You do not have access to this API" });
        }
    }
}

module.exports = new Middleware();
