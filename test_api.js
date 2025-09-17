const axios = require('axios');

async function testAPI() {
    try {
        const response = await axios.post('http://localhost:3000/api/scrape-product', {
            url: 'https://www.abey.com.au/product/tapware/bathroom-three-piece-tapware/piazza-3-piece-basin-mixer-round/?filtered=true'
        });
        
        console.log('Product Name:', response.data.product.name);
        console.log('Base Price:', response.data.product.price);
        console.log('\nVariations found:', response.data.product.variations.length);
        
        response.data.product.variations.forEach(v => {
            console.log(`  ${v.color}: $${v.price}`);
        });
        
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

testAPI();
