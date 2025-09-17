const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.json({
        success: true,
        data: []
    });
});

router.post('/', (req, res) => {
    res.json({
        success: true,
        message: 'Order created successfully',
        data: {
            id: '1',
            order_number: 'ECO-001',
            status: 'pending',
            total_amount: 850.00
        }
    });
});

module.exports = router;