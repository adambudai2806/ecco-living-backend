const axios = require('axios');

async function testProduct(url, productName) {
    try {
        console.log(`\n=== Testing ${productName} ===`);
        const response = await axios.post('http://localhost:3000/api/scrape-product', { url });
        
        console.log('Product Name:', response.data.product.name);
        console.log('Variations found:', response.data.product.variations.length);
        
        response.data.product.variations.forEach(v => {
            console.log(`  ${v.color}: $${v.price}`);
        });
        
        return response.data.product.variations;
    } catch (error) {
        console.error(`Error for ${productName}:`, error.response ? error.response.data : error.message);
        return [];
    }
}

async function testAll() {
    // Test all the products mentioned by the user
    await testProduct(
        'https://www.abey.com.au/product/tapware/bathroom-three-piece-tapware/piazza-3-piece-basin-mixer-round/?filtered=true',
        'Piazza Basin Mixer'
    );
    
    await testProduct(
        'https://www.abey.com.au/product/showers/hand-showers/hand-shower-set/?filtered=true',
        'Hand Shower Set'
    );
    
    await testProduct(
        'https://www.abey.com.au/product/showers/horizontal-showers/abs-150mm-round-shower-with-190mm-arm/',
        'ABS 150mm Round Shower'
    );
}

testAll();
