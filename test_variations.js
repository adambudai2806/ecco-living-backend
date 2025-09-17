const fs = require('fs');
const cheerio = require('cheerio');

// Read the HTML file - detect which file exists
let html;
if (fs.existsSync('shower_test.html')) {
    html = fs.readFileSync('shower_test.html', 'utf8');
    console.log('Testing shower product');
} else if (fs.existsSync('piazza_test.html')) {
    html = fs.readFileSync('piazza_test.html', 'utf8');
    console.log('Testing piazza product');
} else {
    console.error('No test HTML file found');
    process.exit(1);
}
const $ = cheerio.load(html);

// Find the form with variations
const variationForm = $('form[data-product_variations]');
if (variationForm.length > 0) {
    const variationsDataStr = variationForm.attr('data-product_variations');
    console.log('Raw data length:', variationsDataStr.length);
    
    // Write raw data to file for inspection
    fs.writeFileSync('raw_variations.txt', variationsDataStr);
    console.log('Saved raw data to raw_variations.txt');
    
    // Try to decode and parse
    try {
        // Decode HTML entities
        let decodedStr = variationsDataStr
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&#039;/g, "'")
            .replace(/&#39;/g, "'")
            .replace(/&apos;/g, "'");
        
        // Only unescape forward slashes
        decodedStr = decodedStr.replace(/\\\//g, '/');
        
        // Save decoded string for inspection
        fs.writeFileSync('decoded_variations.txt', decodedStr);
        console.log('Saved decoded data to decoded_variations.txt');
        
        // Try parsing
        const variations = JSON.parse(decodedStr);
        console.log(`\nParsed ${variations.length} variations successfully!`);
        
        // Show prices for each variation
        variations.forEach(v => {
            const finish = v.attributes?.attribute_pa_finish || 'unknown';
            const price = v.display_price || v.price || 'N/A';
            console.log(`${finish}: $${price}`);
        });
        
    } catch (e) {
        console.error('Error parsing:', e.message);
        console.error('Position:', e.message.match(/position (\d+)/)?.[1]);
        
        // Show the problematic area
        const pos = parseInt(e.message.match(/position (\d+)/)?.[1] || 0);
        if (pos > 0) {
            const snippet = decodedStr.substring(Math.max(0, pos - 50), pos + 50);
            console.log('\nProblematic area:');
            console.log(snippet);
        }
    }
} else {
    console.log('No form with data-product_variations found');
}