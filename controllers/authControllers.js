const authModel = require('../models/authModel.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class AuthController {
    login = async (req, res) => {
        const { email, password } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Please provide your email' });
        }
        if (!password) {
            return res.status(400).json({ message: 'Please provide your password' });
        }

        try {
            const user = await authModel.findOne({ email }).select('+password');

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            const match = await bcrypt.compare(password, user.password);
            if (!match) {
                return res.status(400).json({ message: 'Invalid password' });
            }

            const tokenPayload = {
                id: user.id,
                name: user.name,
                category: user.category,
                role: user.role
            };
            const token = jwt.sign(tokenPayload, process.env.SECRET, {
                expiresIn: process.env.EXP_TIME
            });

            return res.status(200).json({ message: 'Login success', token });

        } catch (error) {
            console.error('Error during login:', error);
            return res.status(500).json({ message: 'Server error' });
        }
    }
}

module.exports = new AuthController();
