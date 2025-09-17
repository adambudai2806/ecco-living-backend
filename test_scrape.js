const axios = require('axios');

async function testScraping() {
    try {
        const response = await axios.post('http://localhost:3001/api/scraping/scrape', {
            url: 'https://www.abey.com.au/product/tapware/bathroom-three-piece-tapware/piazza-3-piece-basin-mixer-round/?filtered=true'
        });
        
        console.log('Product Name:', response.data.product.name);
        console.log('Base Price: $' + response.data.product.price);
        console.log('\nVariations found:');
        
        response.data.product.variations.forEach(v => {
            console.log(`  ${v.color}: $${v.price}`);
        });
        
        // Check if prices match expected values
        const expectedPrices = {
            'Black': 581,
            'Brushed Nickel': 608,
            'Chrome': 447,
            'Light Gold': 798
        };
        
        console.log('\nPrice Verification:');
        response.data.product.variations.forEach(v => {
            const expected = expectedPrices[v.color];
            const actual = parseFloat(v.price);
            if (expected) {
                const match = Math.abs(expected - actual) < 1 ? '✓' : '✗';
                console.log(`  ${v.color}: Expected $${expected}, Got $${actual} ${match}`);
            }
        });
        
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

testScraping();