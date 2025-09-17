const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
    res.json({
        success: true,
        message: 'Upload endpoint ready',
        data: {
            url: 'https://via.placeholder.com/400x300'
        }
    });
});

module.exports = router;