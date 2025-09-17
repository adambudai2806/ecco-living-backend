const express = require('express');
const router = express.Router();

router.post('/register', (req, res) => {
    res.json({
        success: true,
        message: 'User registered successfully',
        data: {
            id: '1',
            email: req.body.email,
            role: 'customer'
        }
    });
});

router.post('/login', (req, res) => {
    // Mock admin login for development
    if (req.body.email === 'adam@eccoliving.com.au' && req.body.password === 'Gabbie1512') {
        res.json({
            success: true,
            token: 'mock_jwt_token_adam',
            user: {
                id: '1',
                email: 'adam@eccoliving.com.au',
                first_name: 'Adam',
                last_name: 'Budai',
                role: 'admin'
            }
        });
    } else {
        res.status(401).json({
            success: false,
            error: 'Invalid credentials'
        });
    }
});

router.get('/me', (req, res) => {
    res.json({
        success: true,
        data: {
            id: '1',
            email: 'adam@eccoliving.com.au',
            first_name: 'Adam',
            last_name: 'Budai',
            role: 'admin'
        }
    });
});

module.exports = router;