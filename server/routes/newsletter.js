const express = require('express');
const router = express.Router();

router.post('/subscribe', (req, res) => {
    const { email } = req.body;
    
    if (!email) {
        return res.status(400).json({
            success: false,
            error: 'Email is required'
        });
    }

    res.json({
        success: true,
        message: 'Successfully subscribed to newsletter'
    });
});

module.exports = router;