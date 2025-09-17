const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

// Webscraper endpoint
router.post('/scrape-product', async (req, res) => {
    const { url } = req.body;
    
    console.log('🚀 SCRAPER CALLED! URL:', url);
    console.log('🚀 Timestamp:', new Date().toISOString());
    
    if (!url) {
        console.log('❌ No URL provided');
        return res.status(400).json({
            success: false,
            error: 'URL is required'
        });
    }
    
    try {
        console.log('✅ Starting scrape for URL:', url);
        
        // Basic webscraper
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch URL: ${response.statusText}`);
        }
        
        const html = await response.text();
        console.log('HTML fetched, length:', html ? html.length : 'undefined');
        
        const $ = cheerio.load(html);
        console.log('Cheerio loaded successfully');
        
        // Debug: Log page structure
        console.log('Page title:', $('title').text());
        console.log('Main content areas found:');
        console.log('- .content elements:', $('.content').length);
        console.log('- .main elements:', $('.main').length);
        console.log('- article elements:', $('article').length);
        console.log('- .product elements:', $('.product').length);
        console.log('- #content elements:', $('#content').length);
        
        // Extract basic product data with proper null checks
        console.log('Extracting product name...');
        const productName = ($('h1.product_title, h1').first().text() || '').trim() || 'Product Name';
        console.log('Product name:', productName);
        
        console.log('Extracting short description...');
        let shortDesc = $('meta[name="description"]').attr('content') || 
                          $('meta[property="og:description"]').attr('content') || 
                          $('.short-description, .product-short-description').first().text().trim() || '';
        console.log('Short desc length:', shortDesc ? shortDesc.length : 'undefined');
        
        console.log('Extracting long description...');
        let longDesc = '';
        
        // Try multiple selectors for description with more comprehensive list
        const descriptionSelectors = [
            '.product-description',
            '.full-description', 
            '.woocommerce-product-details__short-description',
            '.woocommerce-tabs .description',
            '.entry-summary',
            '.product-details',
            '.product-info',
            '#tab-description',
            '.tab-content .description',
            '.product_description',
            '.single-product-summary',
            '.product-content',
            '[id*="description"]',
            '.description',
            '.product-summary',
            '.summary',
            '.product .content',
            '.product-body',
            '.item-description',
            '.product-text',
            '.product-overview'
        ];
        
        console.log('Trying description selectors...');
        for (const selector of descriptionSelectors) {
            const elements = $(selector);
            console.log(`Selector "${selector}" found ${elements.length} elements`);
            
            elements.each((i, el) => {
                const desc = $(el).text().trim();
                console.log(`  Element ${i} text length: ${desc.length}`);
                if (desc.length > 20) {
                    console.log(`  Element ${i} preview: "${desc.substring(0, 100)}..."`);
                }
                if (desc && desc.length > longDesc.length && desc.length > 20) {
                    longDesc = desc;
                    console.log(`  ✓ Using this description from selector: ${selector}`);
                }
            });
        }
        
        // Additional debug: Show elements with most text content
        if (!longDesc || longDesc.length < 50) {
            console.log('Analyzing elements by text length...');
            const textElements = [];
            
            $('div, section, article, p').each((i, el) => {
                const text = $(el).text().trim();
                if (text.length > 100 && text.length < 5000) {
                    textElements.push({
                        tagName: el.tagName,
                        class: $(el).attr('class') || '',
                        id: $(el).attr('id') || '',
                        textLength: text.length,
                        preview: text.substring(0, 150)
                    });
                }
            });
            
            // Sort by text length descending
            textElements.sort((a, b) => b.textLength - a.textLength);
            
            console.log('Top 5 elements with most text:');
            textElements.slice(0, 5).forEach((el, i) => {
                console.log(`${i + 1}. ${el.tagName}${el.id ? '#' + el.id : ''}${el.class ? '.' + el.class.split(' ')[0] : ''}: ${el.textLength} chars`);
                console.log(`   Preview: "${el.preview}..."`);
            });
            
            // Try using the longest text element if it seems relevant
            if (textElements.length > 0 && !longDesc) {
                const longestElement = textElements[0];
                if (longestElement.textLength > 200) {
                    longDesc = longestElement.preview + '...';
                    console.log('Used longest text element for description');
                }
            }
        }
        
        // If still no description, try to extract from paragraphs
        if (!longDesc || longDesc.length < 50) {
            console.log('Trying paragraph extraction...');
            const paragraphs = $('.entry-content p, .product-info p, .content p, .main p, article p').map((i, el) => {
                const text = $(el).text().trim();
                console.log(`Paragraph ${i}: "${text.substring(0, 100)}..." (${text.length} chars)`);
                return text;
            }).get();
            
            const validParagraphs = paragraphs.filter(p => p.length > 30 && !p.toLowerCase().includes('cookie') && !p.toLowerCase().includes('privacy'));
            if (validParagraphs.length > 0) {
                longDesc = validParagraphs.slice(0, 2).join(' ');
                console.log('Used paragraph extraction for description');
            }
        }
        
        // Try extracting from div elements as last resort
        if (!longDesc || longDesc.length < 20) {
            console.log('Trying div extraction...');
            $('div').each((i, el) => {
                const text = $(el).text().trim();
                if (text.length > 100 && text.length < 2000 && text.includes(productName.split(' ')[0])) {
                    if (text.length > longDesc.length) {
                        longDesc = text;
                        console.log('Found description in div element');
                    }
                }
            });
        }
        
        // Extract brand from domain (needed for AI description)
        let brand = '';
        const domainMatch = url.match(/https?:\/\/(?:www\.)?([^.]+)/);
        if (domainMatch) {
            const domain = domainMatch[1];
            const brandMappings = {
                'astrawalker': 'Astra Walker',
                'abey': 'Abey',
                'milboard': 'Milboard'
            };
            brand = brandMappings[domain.toLowerCase()] || '';
        }
        
        // AI-Enhanced Description Generation
        console.log('Checking if AI description needed. Current longDesc length:', longDesc ? longDesc.length : 0);
        console.log('Starting AI description generation process...');
        
        // FORCE AI generation for testing - comment out this line later if needed
        if (true) { // (!longDesc || longDesc.length < 50) {
            console.log('Generating AI description from page content...');
            
            try {
                // Get all meaningful content from the page
                const pageContent = {
                    title: $('title').text().trim(),
                    headings: $('h1, h2, h3').map((i, el) => $(el).text().trim()).get().filter(h => h),
                    metaDescription: $('meta[name="description"]').attr('content') || '',
                    specifications: {},
                    features: [],
                    allText: $('body').text().replace(/\s+/g, ' ').trim()
                };
                
                console.log('Page content extracted:', {
                    title: pageContent.title,
                    headingsCount: pageContent.headings.length,
                    metaDescription: pageContent.metaDescription ? 'Present' : 'None',
                    textLength: pageContent.allText.length
                });
                
                // Extract specifications from tables
                $('table tr, .specs tr, .specifications tr').each((i, row) => {
                    const cells = $(row).find('td, th');
                    if (cells.length >= 2) {
                        const key = $(cells[0]).text().trim();
                        const value = $(cells[1]).text().trim();
                        if (key && value && key !== value) {
                            pageContent.specifications[key] = value;
                        }
                    }
                });
                
                // Extract feature lists
                $('ul li, ol li').each((i, li) => {
                    const text = $(li).text().trim();
                    if (text.length > 20 && text.length < 200) {
                        pageContent.features.push(text);
                    }
                });
                
                console.log('Content analysis:', {
                    specifications: Object.keys(pageContent.specifications).length,
                    features: pageContent.features.length,
                    headings: pageContent.headings
                });
                
                // Generate AI description
                console.log('Calling generateAIDescription with:', {
                    productName,
                    brand,
                    titleLength: pageContent.title?.length || 0,
                    headingsCount: pageContent.headings?.length || 0,
                    featuresCount: pageContent.features?.length || 0
                });
                const aiDescription = await generateAIDescription(productName, pageContent, brand);
                console.log('AI description result:', aiDescription ? `${aiDescription.length} chars` : 'null');
                
                if (aiDescription) {
                    console.log('AI description preview:', aiDescription.substring(0, 150) + '...');
                }
                
                if (aiDescription && aiDescription.length > 50) {
                    longDesc = aiDescription;
                    shortDesc = shortDesc || aiDescription.split('.')[0] + '.';
                    console.log('✓ Successfully generated AI description');
                } else {
                    console.log('⚠️ AI description was too short or null, trying fallback...');
                    
                    // Fallback: Generate basic description
                    longDesc = generateBasicDescription(productName, pageContent, brand);
                    if (!shortDesc) {
                        shortDesc = longDesc.split('.')[0] + '.';
                    }
                    console.log('✓ Generated fallback description');
                }
            } catch (error) {
                console.error('❌ AI description generation failed:', error);
                
                // Ultimate fallback
                console.log('Using ultimate fallback description...');
                longDesc = generateBasicDescription(productName, { title: $('title').text() }, brand);
                if (!shortDesc) {
                    shortDesc = `Premium ${productName} - High quality Australian home solution.`;
                }
            }
        } else {
            console.log('✓ Already have adequate description, skipping AI generation');
        }
        
        console.log('Final long desc length:', longDesc ? longDesc.length : 'undefined');
        if (longDesc) {
            console.log('Long desc preview:', longDesc.substring(0, 200) + '...');
        }
        
        // Extract original manufacturer SKU from description 
        console.log('Extracting original manufacturer SKU...');
        const searchText = (longDesc || '') + ' ' + (html || '');
        console.log('Search text length:', searchText ? searchText.length : 'undefined');
        let originalSku = 'UNKNOWN-SKU';
        
        // Try to extract manufacturer SKU from various patterns
        const codeMatch = searchText.match(/code:\s*([A-Z0-9.-]+)/i) || 
                         searchText.match(/sku:\s*([A-Z0-9.-]+)/i) ||
                         searchText.match(/model:\s*([A-Z0-9.-]+)/i) ||
                         searchText.match(/part.*number:\s*([A-Z0-9.-]+)/i);
                         
        if (codeMatch && codeMatch[1]) {
            originalSku = codeMatch[1];
        } else {
            // Try to extract from URL or product name
            const urlParts = url.split('/');
            const lastPart = urlParts[urlParts.length - 2]; // Get second to last part of URL
            if (lastPart && lastPart.match(/[A-Z0-9-]+/)) {
                originalSku = lastPart.toUpperCase();
            }
        }
        
        // Generate sequential EL- SKU 
        const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
        const randomNum = Math.floor(Math.random() * 100).toString().padStart(2, '0');
        const elSku = `EL-${timestamp}${randomNum}`;
        
        console.log('Original manufacturer SKU:', originalSku);
        console.log('Generated Ecco Living SKU:', elSku);
        
        
        // Extract price with null safety
        let price = 0;
        const priceElement = ($('.price .amount, .woocommerce-Price-amount, .price').first().text() || '').trim();
        if (priceElement && priceElement.length > 0) {
            const cleanPrice = priceElement.replace(/[^\d,.\s]/g, '').trim();
            const priceMatch = cleanPrice.match(/[\d,]+\.?\d*/);
            if (priceMatch && priceMatch[0]) {
                const scrapedPrice = parseFloat(priceMatch[0].replace(/,/g, '')) || 0;
                price = scrapedPrice; // Use the actual scraped price
                console.log(`Using scraped price: $${price}`);
            }
        }
        
        // If no price found, set default supplier price
        if (price === 0) {
            price = 300; // Reasonable default price
            console.log('No price found, using default price:', price);
        }
        
        // Extract downloadable files
        console.log('Extracting downloadable files...');
        const documents = [];
        
        // Look for download links
        const downloadSelectors = [
            'a[href$=".pdf"]',
            'a[href$=".doc"]',
            'a[href$=".docx"]',
            'a[href$=".xls"]',
            'a[href$=".xlsx"]',
            'a[href$=".zip"]',
            'a[href$=".dwg"]',
            'a[href$=".cad"]',
            'a[href*="download"]',
            'a[href*="datasheet"]',
            'a[href*="manual"]',
            'a[href*="spec"]',
            'a[href*="brochure"]',
            'a[href*="catalog"]'
        ];
        
        downloadSelectors.forEach(selector => {
            $(selector).each((i, link) => {
                const href = $(link).attr('href');
                let text = $(link).text().trim();
                
                // Clean the text - remove CSS, extra whitespace, and HTML artifacts
                text = text.replace(/\s+/g, ' ').trim();
                
                // If text is still messy (contains CSS or is too long), try to extract from filename or use generic name
                let cleanName = text;
                if (text.length > 50 || text.includes('{') || text.includes('stroke') || text.includes('fill:')) {
                    // Extract filename from URL
                    const filename = href ? href.split('/').pop().replace(/\.[^/.]+$/, '') : '';
                    const urlParts = href ? href.split('/') : [];
                    
                    // Try to find a meaningful name from URL structure
                    if (filename && filename.length > 3) {
                        cleanName = filename.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                        
                        // Make specific filenames more user-friendly
                        if (cleanName.toLowerCase().includes('installation')) {
                            cleanName = 'Installation Guide';
                        } else if (cleanName.toLowerCase().includes('tech') || cleanName.toLowerCase().includes('spec')) {
                            cleanName = 'Technical Specification';
                        } else if (cleanName.toLowerCase().includes('brochure')) {
                            cleanName = 'Product Brochure';
                        } else if (cleanName.match(/^[A-Z]{3,}\d+/)) {
                            // Handle product codes like "WSS001 316"
                            cleanName = 'Technical Specification';
                        }
                    } else if (urlParts.some(part => part.includes('installation'))) {
                        cleanName = 'Installation Guide';
                    } else if (urlParts.some(part => part.includes('tech') || part.includes('spec'))) {
                        cleanName = 'Technical Specification';
                    } else if (urlParts.some(part => part.includes('brochure'))) {
                        cleanName = 'Product Brochure';
                    } else {
                        cleanName = 'Product Document';
                    }
                }
                
                const title = $(link).attr('title')?.trim() || cleanName;
                
                // Skip obvious non-document links
                if (href && href.includes('#') && !href.includes('.pdf') && !href.includes('.doc') && !href.includes('.dwg')) {
                    return; // Skip anchor links like #single-product-downloads
                }
                
                if (href && !documents.some(doc => doc.url === href)) {
                    const fullUrl = href.startsWith('http') ? href : new URL(href, url).href;
                    const fileExtension = href.split('.').pop().toLowerCase();
                    
                    let docType = 'document';
                    
                    // Determine document type based on content and extension
                    if (['pdf'].includes(fileExtension)) {
                        // For PDFs, determine type based on name/content
                        const nameCheck = cleanName.toLowerCase();
                        if (nameCheck.includes('installation') || nameCheck.includes('install')) {
                            docType = 'installation guide';
                        } else if (nameCheck.includes('specification') || nameCheck.includes('spec') || nameCheck.includes('tech')) {
                            docType = 'technical specification';
                        } else if (nameCheck.includes('brochure') || nameCheck.includes('catalog')) {
                            docType = 'brochure';
                        } else if (nameCheck.includes('manual') || nameCheck.includes('user guide')) {
                            docType = 'manual';
                        } else {
                            docType = 'pdf document'; // Generic PDF
                        }
                    } else if (['dwg', 'cad'].includes(fileExtension)) {
                        docType = 'drawing';
                    } else if (['doc', 'docx'].includes(fileExtension)) {
                        docType = 'manual';
                    } else if (['xls', 'xlsx'].includes(fileExtension)) {
                        docType = 'specification';
                    } else if (['zip'].includes(fileExtension)) {
                        docType = 'archive';
                    }
                    
                    documents.push({
                        name: title || `${productName} ${docType}`,
                        url: fullUrl,
                        type: docType,
                        extension: fileExtension
                    });
                    
                    console.log(`Found ${docType}: ${title || href}`);
                }
            });
        });
        
        console.log(`Found ${documents.length} downloadable files`);
        
        // Process PDF files for additional content extraction
        for (const doc of documents.filter(d => d.type === 'datasheet')) {
            try {
                console.log(`Processing PDF: ${doc.name}`);
                const pdfContent = await extractPDFContent(doc.url);
                if (pdfContent) {
                    // Extract specifications from PDF
                    const pdfSpecs = extractSpecificationsFromText(pdfContent);
                    Object.assign(specifications, pdfSpecs);
                    
                    // Use PDF content to enhance description if needed
                    if (!longDesc || longDesc.length < 100) {
                        const pdfDescription = await generateAIDescriptionFromPDF(productName, pdfContent, brand);
                        if (pdfDescription && pdfDescription.length > longDesc.length) {
                            longDesc = pdfDescription;
                            console.log('Enhanced description using PDF content');
                        }
                    }
                }
            } catch (error) {
                console.warn(`Failed to process PDF ${doc.name}:`, error.message);
            }
        }

        // Extract images with comprehensive approach
        console.log('Extracting images...');
        const images = [];
        const imageUrls = new Set(); // Use Set to avoid duplicates
        
        // Debug: See what img tags exist
        console.log('Total img tags found:', $('img').length);
        
        // Debug: Show all img elements and their attributes
        console.log('All img elements:');
        $('img').each((i, img) => {
            console.log(`IMG ${i}:`, {
                src: $(img).attr('src'),
                'data-src': $(img).attr('data-src'),
                'data-srcset': $(img).attr('data-srcset'),
                srcset: $(img).attr('srcset'),
                class: $(img).attr('class'),
                alt: $(img).attr('alt'),
                id: $(img).attr('id')
            });
        });
        
        // Method 1: Standard img tags
        $('img').each((i, img) => {
            const src = $(img).attr('src');
            const dataSrc = $(img).attr('data-src'); // Lazy loading
            const dataSrcset = $(img).attr('data-srcset');
            const srcset = $(img).attr('srcset');
            const alt = $(img).attr('alt') || '';
            const classes = $(img).attr('class') || '';
            
            // Try multiple src attributes
            const imageSources = [src, dataSrc, dataSrcset, srcset].filter(Boolean);
            
            imageSources.forEach(imgSrc => {
                if (imgSrc && (imgSrc.includes('.jpg') || imgSrc.includes('.png') || imgSrc.includes('.webp') || imgSrc.includes('.jpeg'))) {
                    console.log(`Image ${i}:`, imgSrc.substring(0, 100), 'alt:', alt, 'class:', classes);
                    
                    // More lenient filtering - only exclude obvious non-product images
                    const isExcluded = imgSrc && (
                        imgSrc.includes('logo') || 
                        imgSrc.includes('icon') || 
                        imgSrc.includes('avatar') || 
                        imgSrc.includes('header') ||
                        imgSrc.includes('footer') ||
                        imgSrc.includes('nav') ||
                        imgSrc.includes('menu') ||
                        classes.includes('logo') ||
                        alt.toLowerCase().includes('logo')
                    );
                    
                    if (!isExcluded) {
                        try {
                            const fullUrl = imgSrc.startsWith('http') ? imgSrc : new URL(imgSrc, url).href;
                            
                            // Handle srcset (multiple images)
                            if (imgSrc.includes(',')) {
                                imgSrc.split(',').forEach(srcsetItem => {
                                    const cleanSrc = srcsetItem.trim().split(' ')[0]; // Remove size descriptors
                                    if (cleanSrc) {
                                        const fullSrcsetUrl = cleanSrc.startsWith('http') ? cleanSrc : new URL(cleanSrc, url).href;
                                        imageUrls.add(fullSrcsetUrl);
                                    }
                                });
                            } else {
                                imageUrls.add(fullUrl);
                            }
                        } catch (e) {
                            console.log('Error processing image URL:', imgSrc, e.message);
                        }
                    }
                }
            });
        });
        
        // Method 2: Look for background images in style attributes
        console.log('Checking for background images...');
        $('[style*="background-image"]').each((i, el) => {
            const style = $(el).attr('style') || '';
            const bgMatch = style.match(/background-image:\s*url\(['"]?([^'"()]+)['"]?\)/);
            if (bgMatch && bgMatch[1]) {
                try {
                    const fullUrl = bgMatch[1].startsWith('http') ? bgMatch[1] : new URL(bgMatch[1], url).href;
                    if (fullUrl.match(/\.(jpg|jpeg|png|webp)$/i)) {
                        imageUrls.add(fullUrl);
                        console.log('Found background image:', fullUrl);
                    }
                } catch (e) {
                    console.log('Error processing background image:', bgMatch[1]);
                }
            }
        });
        
        // Method 3: Look in gallery containers
        console.log('Checking gallery containers...');
        const gallerySelectors = [
            '.product-gallery img',
            '.woocommerce-product-gallery img',
            '.gallery img',
            '.product-images img',
            '.product-photos img',
            '.slider img',
            '.carousel img'
        ];
        
        gallerySelectors.forEach(selector => {
            $(selector).each((i, img) => {
                const src = $(img).attr('src') || $(img).attr('data-src');
                if (src) {
                    try {
                        const fullUrl = src.startsWith('http') ? src : new URL(src, url).href;
                        imageUrls.add(fullUrl);
                        console.log(`Found gallery image from ${selector}:`, fullUrl);
                    } catch (e) {
                        console.log('Error processing gallery image:', src);
                    }
                }
            });
        });
        
        // Convert Set to Array and limit to reasonable number
        const uniqueImages = Array.from(imageUrls).slice(0, 15);
        images.push(...uniqueImages);
        
        console.log('Found valid images:', images.length);
        images.forEach((img, i) => console.log(`  ${i + 1}: ${img.substring(0, 80)}...`));
        
        // Extract variations/colors with prices - multiple methods
        console.log('Extracting variations...');
        const variations = [];
        
        // Pre-extract script content for variation analysis
        let allScriptContent = '';
        try {
            const scriptTags = $('script').map((i, el) => $(el).html()).get();
            allScriptContent = scriptTags.join(' ');
            console.log('Pre-extracted script content for variations, length:', allScriptContent.length);
        } catch (e) {
            console.log('Error pre-extracting script content:', e.message);
        }
        
        // Debug: Check what select elements exist
        console.log('Total select elements found:', $('select').length);
        console.log('Total option elements found:', $('option').length);
        
        // Method 1: Look for actual select dropdowns with finish options
        // First identify which select elements are likely to contain product variations
        const productSelects = [];
        $('select').each((i, select) => {
            const $select = $(select);
            const selectId = $select.attr('id') || '';
            const selectClass = $select.attr('class') || '';
            const selectName = $select.attr('name') || '';
            const parentText = $select.parent().text().toLowerCase();
            
            // Skip selects that are clearly not product variations
            const isLocationDropdown = /location|showroom|state|city|branch/i.test(selectId + selectClass + selectName + parentText);
            const isTimeDropdown = /time|appointment|hour|minute|am|pm/i.test(selectId + selectClass + selectName + parentText);
            const isQuantityDropdown = /quantity|qty|amount/i.test(selectId + selectClass + selectName + parentText);
            const isShippingDropdown = /shipping|delivery|courier/i.test(selectId + selectClass + selectName + parentText);
            
            // Look for indicators that this IS a product variation dropdown
            const isVariationDropdown = /variation|color|colour|finish|style|size|option/i.test(selectId + selectClass + selectName + parentText);
            const isWooCommerceVariation = /variation|attribute/i.test(selectClass + selectName);
            
            if (!isLocationDropdown && !isTimeDropdown && !isQuantityDropdown && !isShippingDropdown) {
                if (isVariationDropdown || isWooCommerceVariation) {
                    productSelects.push($select);
                    console.log(`Found potential product variation select: ID="${selectId}" Class="${selectClass}" Name="${selectName}"`);
                } else {
                    // Check if options look like product variations (colors, finishes, etc.)
                    const options = $select.find('option').map((j, opt) => $(opt).text().trim()).get();
                    const hasColorWords = options.some(opt => 
                        /chrome|black|white|gold|brass|bronze|silver|platinum|copper|nickel|steel|finish/i.test(opt)
                    );
                    
                    if (hasColorWords && options.length > 1) {
                        productSelects.push($select);
                        console.log(`Found product variation select based on color words: options="${options.join(', ')}"`);
                    } else {
                        console.log(`Skipping non-variation select: ID="${selectId}" options="${options.join(', ')}"`);
                    }
                }
            } else {
                console.log(`Skipping non-product select: ID="${selectId}" (identified as location/time/quantity/shipping)`);
            }
        });
        
        console.log(`Found ${productSelects.length} product variation selects out of ${$('select').length} total selects`);
        
        // Script content already extracted above for variation analysis
        
        // Analyze JavaScript for color/price mappings BEFORE processing variations
        const colorPriceMappings = {};
        console.log('Analyzing JavaScript for color/price relationships...');
        
        // Look for WooCommerce variation data
        const wooVariationPattern = /product_variations\s*=\s*(\[.*?\])/gs;
        const wooMatch = allScriptContent.match(wooVariationPattern);
        if (wooMatch) {
            try {
                const variationData = JSON.parse(wooMatch[1]);
                if (Array.isArray(variationData)) {
                    variationData.forEach((variation) => {
                        if (variation.display_price && variation.attributes) {
                            const varPrice = parseFloat(variation.display_price);
                            Object.values(variation.attributes).forEach(attrValue => {
                                if (attrValue && typeof attrValue === 'string') {
                                    const colorKey = attrValue.toLowerCase().trim();
                                    if (varPrice > 50 && varPrice < 10000) {
                                        colorPriceMappings[colorKey] = varPrice;
                                        console.log(`WooCommerce mapping: ${colorKey} = $${varPrice}`);
                                    }
                                }
                            });
                        }
                    });
                }
            } catch (e) {
                console.log('Error parsing WooCommerce data:', e.message);
            }
        }
        
        console.log('JavaScript color-price mappings found:', Object.keys(colorPriceMappings).length, 'mappings');
        
        // Enhanced method: Analyze JavaScript code for price change logic
        console.log('Analyzing JavaScript for additional color/price relationships...');
        
        // Look for JavaScript objects/arrays that map colors to prices
        console.log('Searching for color-price mapping patterns in JavaScript...');
        
        // Pattern 1: Look for objects with color codes and prices
        const objectPatterns = [
            /\{[^}]*["'](?:black|chrome|brass|nickel|gold|platinum|gunmetal|gun-metal)["'][^}]*["']?(\d+(?:\.\d+)?)["']?[^}]*\}/gi,
            /["'](?:black|chrome|brass|nickel|gold|platinum|gunmetal)["']\s*:\s*(\d+(?:\.\d+)?)/gi,
            /(\d+(?:\.\d+)?)\s*:\s*["'](?:black|chrome|brass|nickel|gold|platinum|gunmetal)["']/gi
        ];
        
        objectPatterns.forEach((pattern, patternIndex) => {
            console.log(`Trying pattern ${patternIndex + 1}...`);
            const matches = allScriptContent.matchAll(pattern);
            for (const match of matches) {
                console.log(`Pattern ${patternIndex + 1} match:`, match[0]);
                
                // Extract color and price from the match
                const matchText = match[0].toLowerCase();
                const priceValue = parseFloat(match[1]);
                
                if (priceValue > 50 && priceValue < 10000) {
                    // Determine which color this price belongs to
                    if (matchText.includes('black')) colorPriceMappings['black'] = priceValue;
                    else if (matchText.includes('chrome')) colorPriceMappings['chrome'] = priceValue;
                    else if (matchText.includes('brass')) colorPriceMappings['brass'] = priceValue;
                    else if (matchText.includes('nickel')) colorPriceMappings['nickel'] = priceValue;
                    else if (matchText.includes('gold')) colorPriceMappings['gold'] = priceValue;
                    else if (matchText.includes('platinum')) colorPriceMappings['platinum'] = priceValue;
                    else if (matchText.includes('gunmetal') || matchText.includes('gun-metal')) colorPriceMappings['gunmetal'] = priceValue;
                    
                    console.log(`Found price mapping: ${Object.keys(colorPriceMappings).pop()} = $${priceValue}`);
                }
            }
        });
        
        // Pattern 2: Look for arrays or lists with color-price data
        const arrayPatterns = [
            /\[\s*\{[^}]*(?:color|finish)[^}]*price[^}]*\}[^]]*\]/gi,
            /\[\s*\{[^}]*price[^}]*(?:color|finish)[^}]*\}[^]]*\]/gi
        ];
        
        arrayPatterns.forEach((pattern, patternIndex) => {
            console.log(`Trying array pattern ${patternIndex + 1}...`);
            const matches = allScriptContent.matchAll(pattern);
            // Code for processing array patterns will go here
        });
        
        // Now process options only from product variation selects
        productSelects.forEach(($select, selectIndex) => {
            console.log(`Processing variation select ${selectIndex + 1}:`);
            
            // Debug: Check if this select has any price-related attributes or nearby price elements
            const selectParent = $select.parent();
            const nearbyPriceElements = selectParent.find('.price, .amount, [class*="price"], [data-price]');
            console.log(`Select ${selectIndex + 1} has ${nearbyPriceElements.length} nearby price elements`);
            
            $select.find('option').each((i, option) => {
                const $option = $(option);
                const text = $option.text().trim();
                const value = $option.attr('value');
                const dataPrice = $option.attr('data-price');
                const dataCost = $option.attr('data-cost');
                
                console.log(`Option ${i}:`, {
                    text: text,
                    value: value,
                    dataPrice: dataPrice,
                    dataCost: dataCost,
                    allAttribs: Array.from(option.attributes).map(attr => `${attr.name}="${attr.value}"`).join(' ')
                });
                
                if (text && text !== 'Choose an option' && text !== 'Select' && value && text.length > 1) {
                    console.log('Found valid option:', text, 'value:', value);
                
                // Extract price from option text - look for multiple price patterns
                let variantPrice = price; // Start with base price
                let finishName = text.replace(/\([^)]*\)/, '').trim();
                let foundVariationData = false; // Move this declaration outside the if block
                
                // Special handling for Abey website - check for variation-specific prices
                // These are typically loaded via JavaScript, so we need to look for them in the page
                if (url.includes('abey.com.au')) {
                    
                    // FIRST: Look for data-product_variations attribute in forms
                    // This is the most reliable source for WooCommerce variation prices
                    const variationForm = $('form[data-product_variations]');
                    console.log('Looking for form with data-product_variations, found:', variationForm.length);
                    if (variationForm.length > 0) {
                        const variationsDataStr = variationForm.attr('data-product_variations');
                        console.log('data-product_variations attribute length:', variationsDataStr ? variationsDataStr.length : 0);
                        if (variationsDataStr) {
                            try {
                                // The data is HTML-encoded, need to decode it properly
                                // First decode HTML entities
                                let decodedStr = variationsDataStr
                                    .replace(/&quot;/g, '"')
                                    .replace(/&amp;/g, '&')
                                    .replace(/&lt;/g, '<')
                                    .replace(/&gt;/g, '>')
                                    .replace(/&#039;/g, "'")
                                    .replace(/&#39;/g, "'")
                                    .replace(/&apos;/g, "'");
                                
                                // Handle escaped forward slashes (\/), but keep other backslashes for JSON
                                decodedStr = decodedStr.replace(/\\\//g, '/');
                                
                                const variationsData = JSON.parse(decodedStr);
                                console.log(`Found ${variationsData.length} variations in data-product_variations`);
                                
                                // Find the variation matching our current option
                                const matchingVariation = variationsData.find(v => {
                                    // Check if any attribute matches our option value
                                    if (v.attributes) {
                                        return Object.values(v.attributes).some(attr => {
                                            if (!attr) return false;
                                            const attrLower = attr.toLowerCase().trim();
                                            const valueLower = value.toLowerCase().trim();
                                            const finishLower = finishName.toLowerCase().trim();
                                            
                                            // Try multiple matching strategies
                                            return attrLower === valueLower || 
                                                   attrLower === finishLower ||
                                                   attrLower.replace(/-/g, ' ') === valueLower.replace(/-/g, ' ') ||
                                                   attrLower.replace(/-/g, ' ') === finishLower.replace(/-/g, ' ');
                                        });
                                    }
                                    return false;
                                });
                                
                                if (matchingVariation) {
                                    // Try different price fields
                                    const priceValue = matchingVariation.display_price || 
                                                      matchingVariation.price || 
                                                      matchingVariation.regular_price;
                                    
                                    if (priceValue) {
                                        // Extract numeric value if it's a string
                                        if (typeof priceValue === 'string') {
                                            const numMatch = priceValue.match(/[\d,.]+/);
                                            if (numMatch) {
                                                variantPrice = parseFloat(numMatch[0].replace(/,/g, ''));
                                            }
                                        } else {
                                            variantPrice = parseFloat(priceValue);
                                        }
                                        
                                        console.log(`Found exact Abey price for ${finishName}: $${variantPrice} (from data-product_variations)`);
                                        foundVariationData = true;
                                    }
                                    
                                    // Extract image from variation data if available
                                    if (matchingVariation.image) {
                                        const variantImageUrl = matchingVariation.image.full_src || 
                                                               matchingVariation.image.src || 
                                                               matchingVariation.image.url;
                                        if (variantImageUrl) {
                                            // Add to images array if not already present
                                            if (!images.includes(variantImageUrl)) {
                                                images.push(variantImageUrl);
                                                console.log(`Added variant image for ${finishName}: ${variantImageUrl}`);
                                            }
                                            // Store reference for later use
                                            matchingVariation._extractedImage = variantImageUrl;
                                        }
                                    }
                                }
                            } catch (e) {
                                console.log('Error parsing data-product_variations:', e.message);
                            }
                        }
                    }
                    
                    // SECOND: If not found in data attribute, look in JavaScript
                    if (!foundVariationData) {
                        const scriptContent = allScriptContent || '';
                        
                        // Look for WooCommerce variations data in script tags
                        const variationsPatterns = [
                            /product_variations\s*=\s*(\[[^\]]+\])/s,
                            /variations\s*[=:]\s*(\[[^\]]+\])/s,
                            /wc_product_variations\s*=\s*(\[[^\]]+\])/s,
                            /"variations"\s*:\s*(\[[^\]]+\])/s
                        ];
                        
                        for (const pattern of variationsPatterns) {
                            const variationsMatch = scriptContent.match(pattern);
                            if (variationsMatch) {
                                try {
                                    // Clean up the JSON string
                                    let jsonStr = variationsMatch[1];
                                    // Handle escaped quotes
                                    jsonStr = jsonStr.replace(/\\"/g, '"');
                                    
                                    const variationsData = JSON.parse(jsonStr);
                                    console.log(`Found ${variationsData.length} variations in JavaScript data`);
                                    
                                    // Find the variation matching our current option
                                    const matchingVariation = variationsData.find(v => {
                                        // Check if any attribute matches our option value
                                        if (v.attributes) {
                                            return Object.values(v.attributes).some(attr => {
                                                if (!attr) return false;
                                                const attrLower = attr.toLowerCase().trim();
                                                const valueLower = value.toLowerCase().trim();
                                                const finishLower = finishName.toLowerCase().trim();
                                                
                                                // Try multiple matching strategies
                                                return attrLower === valueLower || 
                                                       attrLower === finishLower ||
                                                       attrLower.includes(valueLower) ||
                                                       valueLower.includes(attrLower);
                                            });
                                        }
                                        return false;
                                    });
                                    
                                    if (matchingVariation) {
                                        // Try different price fields
                                        const priceValue = matchingVariation.display_price || 
                                                          matchingVariation.price || 
                                                          matchingVariation.regular_price ||
                                                          matchingVariation.price_html;
                                        
                                        if (priceValue) {
                                            // Extract numeric value if it's a string
                                            if (typeof priceValue === 'string') {
                                                const numMatch = priceValue.match(/[\d,.]+/);
                                                if (numMatch) {
                                                    variantPrice = parseFloat(numMatch[0].replace(/,/g, ''));
                                                }
                                            } else {
                                                variantPrice = parseFloat(priceValue);
                                            }
                                            
                                            console.log(`Found exact Abey price for ${finishName}: $${variantPrice} (from JavaScript)`);
                                            foundVariationData = true;
                                            break;
                                        }
                                    }
                                } catch (e) {
                                    console.log('Error parsing variations data:', e.message);
                                }
                            }
                        }
                    }
                    
                    // THIRD: If still no price found, look for individual SKU prices in the page
                    if (!foundVariationData && variantPrice === price) {
                        const pageText = $('body').text();
                        // Look for price patterns specific to this color/finish
                        const colorPricePatterns = [
                            new RegExp(`${value}[^$]*\\$([\\d,.]+)`, 'i'),
                            new RegExp(`${finishName}[^$]*\\$([\\d,.]+)`, 'i'),
                            new RegExp(`data-${value}[^>]*>\\$([\\d,.]+)`, 'i')
                        ];
                        
                        for (const pattern of colorPricePatterns) {
                            const match = pageText.match(pattern);
                            if (match) {
                                const extractedPrice = parseFloat(match[1].replace(/,/g, ''));
                                if (extractedPrice > 0 && extractedPrice !== price) {
                                    variantPrice = extractedPrice;
                                    console.log(`Found page price for ${finishName}: $${variantPrice}`);
                                    foundVariationData = true;
                                    break;
                                }
                            }
                        }
                    }
                    
                    // Pattern 2: Look for price range in page text (e.g., "$147.00 – $220.00")
                    if (variantPrice === price) {
                        // Extract price range from the page
                        const pageTextForRange = $('body').text();
                        const priceRangePattern = /\$?([\d,.]+)\s*[–-]\s*\$?([\d,.]+)/;
                        const priceRangeMatch = pageTextForRange.match(priceRangePattern);
                        
                        if (priceRangeMatch) {
                            const minPrice = parseFloat(priceRangeMatch[1].replace(/,/g, ''));
                            const maxPrice = parseFloat(priceRangeMatch[2].replace(/,/g, ''));
                            
                            // Try to determine which price to use based on the finish
                            const finishLower = finishName.toLowerCase();
                            
                            // Premium finishes typically cost more
                            const premiumFinishes = ['black', 'gun metal', 'gunmetal', 'brushed brass', 'brushed gold', 'gold', 'brass'];
                            const standardFinishes = ['chrome', 'silver'];
                            const midRangeFinishes = ['brushed nickel', 'nickel'];
                            
                            if (premiumFinishes.some(f => finishLower.includes(f))) {
                                variantPrice = maxPrice;
                                console.log(`Using max price for premium finish ${finishName}: $${variantPrice}`);
                            } else if (standardFinishes.some(f => finishLower.includes(f))) {
                                variantPrice = minPrice;
                                console.log(`Using min price for standard finish ${finishName}: $${variantPrice}`);
                            } else if (midRangeFinishes.some(f => finishLower.includes(f))) {
                                // Use a price between min and max
                                variantPrice = minPrice + (maxPrice - minPrice) * 0.3;
                                console.log(`Using mid-range price for ${finishName}: $${variantPrice}`);
                            } else {
                                // Default to base price if we can't determine
                                variantPrice = price;
                                console.log(`Using base price for ${finishName}: $${variantPrice}`);
                            }
                        }
                    }
                    
                    // Pattern 3: Look for specific variant SKU patterns with prices
                    if (variantPrice === price) {
                        // Try to find price for this specific variant
                        // Pattern: "black":{"price":"581"} or similar
                        const variantPricePattern = new RegExp(`"${value}"\\s*:\\s*\\{[^}]*"price"\\s*:\\s*"?(\\d+(?:\\.\\d+)?)"?`, 'i');
                        const variantMatch = allScriptContent.match(variantPricePattern);
                        
                        if (variantMatch) {
                            variantPrice = parseFloat(variantMatch[1]);
                            console.log(`Found Abey variant price for ${finishName}: $${variantPrice}`);
                        }
                    }
                }
                
                // Pattern 1: Price in parentheses like "Chrome ($308.00)" or "Matt Black (+$50.00)"
                const priceInParentheses = text.match(/\(([+\-]?)[\$]?([\d,.]+)\)/);
                
                // Pattern 2: Price after dash like "Chrome - $308.00"
                const priceAfterDash = text.match(/[-–]\s*[\$]?([\d,.]+)/);
                
                // Pattern 3: Price at end like "Matt Black $358.00"
                const priceAtEnd = text.match(/[\$]([\d,.]+)$/);
                
                // Pattern 4: Look for data attributes on the option element
                const dataPrice = $option.attr('data-price') || $option.attr('data-cost');
                
                // Skip other price extraction methods if we already found an Abey price
                if (url.includes('abey.com.au') && variantPrice !== price) {
                    console.log(`Keeping Abey price for ${finishName}: $${variantPrice}`);
                } else if (priceInParentheses) {
                    const priceDiff = parseFloat(priceInParentheses[2].replace(/,/g, '')) || 0;
                    const isAdditional = priceInParentheses[1] === '+' || (priceInParentheses[1] === '' && priceDiff < 100);
                    
                    if (isAdditional) {
                        variantPrice = price + priceDiff; // Add to base price
                    } else if (priceDiff > 50) {
                        variantPrice = priceDiff; // Use as absolute price if it's a reasonable amount
                    } else {
                        variantPrice = price + priceDiff; // Small amounts are likely additions
                    }
                    console.log(`Price in parentheses for ${finishName}: ${priceInParentheses[0]} → $${variantPrice}`);
                    
                } else if (priceAfterDash) {
                    variantPrice = parseFloat(priceAfterDash[1].replace(/,/g, '')) || price;
                    console.log(`Price after dash for ${finishName}: $${variantPrice}`);
                    
                } else if (priceAtEnd) {
                    variantPrice = parseFloat(priceAtEnd[1].replace(/,/g, '')) || price;
                    console.log(`Price at end for ${finishName}: $${variantPrice}`);
                    
                } else if (dataPrice) {
                    variantPrice = parseFloat(dataPrice.replace(/[^\d.]/g, '')) || price;
                    console.log(`Data attribute price for ${finishName}: $${variantPrice}`);
                    
                } else {
                    // Enhanced auto-pricing: Look for multiple price patterns on the page
                    const optionValue = $option.attr('value');
                    let foundPrice = false;
                    
                    if (optionValue) {
                        // Method 1: Look for price patterns with option value
                        const pageText = $('body').text();
                        const optionPricePatterns = [
                            new RegExp(`${optionValue}[^\\d]*\\$([\\d,.]+)`, 'i'),
                            new RegExp(`${finishName}[^\\d]*\\$([\\d,.]+)`, 'i'),
                            new RegExp(`${finishName}.*?([\\d,.]+)`, 'i')
                        ];
                        
                        for (const pattern of optionPricePatterns) {
                            const match = pageText.match(pattern);
                            if (match) {
                                const foundPriceValue = parseFloat(match[1].replace(/,/g, ''));
                                if (foundPriceValue > 50 && foundPriceValue < 10000) { // Reasonable price range
                                    variantPrice = foundPriceValue;
                                    foundPrice = true;
                                    console.log(`Found price in page content for ${finishName}: $${variantPrice}`);
                                    break;
                                }
                            }
                        }
                    }
                    
                    // Method 2: Check JavaScript color-price mappings
                    if (!foundPrice && Object.keys(colorPriceMappings).length > 0) {
                        const finishLower = finishName.toLowerCase().trim();
                        
                        // Try to match finish name with JavaScript color mappings
                        for (const [color, mappedPrice] of Object.entries(colorPriceMappings)) {
                            if (finishLower.includes(color) || value.includes(color)) {
                                variantPrice = mappedPrice;
                                foundPrice = true;
                                console.log(`Found JS mapping for ${finishName}: $${variantPrice}`);
                                break;
                            }
                        }
                    }
                    
                    // Method 3: Only use base price if no specific price found anywhere
                    if (!foundPrice) {
                        variantPrice = price; // Use same price as base product
                        console.log(`No specific price found for ${finishName}, using base price: $${variantPrice}`);
                    }
                }
                
                // Find corresponding image for this color/finish with enhanced matching
                let colorImage = null;
                
                // First check if we extracted an image from variation data for Abey
                if (url.includes('abey.com.au') && foundVariationData) {
                    // Try to get the image we stored earlier
                    const variationForm = $('form[data-product_variations]');
                    if (variationForm.length > 0) {
                        const variationsDataStr = variationForm.attr('data-product_variations');
                        if (variationsDataStr) {
                            try {
                                let decodedStr = variationsDataStr
                                    .replace(/&quot;/g, '"')
                                    .replace(/&amp;/g, '&')
                                    .replace(/&lt;/g, '<')
                                    .replace(/&gt;/g, '>')
                                    .replace(/&#039;/g, "'")
                                    .replace(/&#39;/g, "'")
                                    .replace(/&apos;/g, "'")
                                    .replace(/\\\//g, '/');
                                
                                const variationsData = JSON.parse(decodedStr);
                                const matchingVar = variationsData.find(v => {
                                    if (v.attributes) {
                                        return Object.values(v.attributes).some(attr => {
                                            if (!attr) return false;
                                            const attrLower = attr.toLowerCase().trim();
                                            const valueLower = value.toLowerCase().trim();
                                            const finishLower = finishName.toLowerCase().trim();
                                            return attrLower === valueLower || 
                                                   attrLower === finishLower ||
                                                   attrLower.replace(/-/g, ' ') === valueLower.replace(/-/g, ' ') ||
                                                   attrLower.replace(/-/g, ' ') === finishLower.replace(/-/g, ' ');
                                        });
                                    }
                                    return false;
                                });
                                
                                if (matchingVar && matchingVar.image) {
                                    colorImage = matchingVar.image.full_src || 
                                                matchingVar.image.src || 
                                                matchingVar.image.url;
                                    if (colorImage) {
                                        console.log(`Using Abey variant image for ${finishName}: ${colorImage}`);
                                    }
                                }
                            } catch (e) {
                                console.log('Error getting variant image:', e.message);
                            }
                        }
                    }
                }
                
                // If no variant-specific image found, try to match from general images
                if (!colorImage) {
                    let bestImageMatch = null;
                    let bestMatchScore = 0;
                    
                    for (const imgUrl of images) {
                        const imgLower = imgUrl.toLowerCase();
                        const finishLower = finishName.toLowerCase().replace(/\s+/g, '');
                        const finishWords = finishName.toLowerCase().split(/[\s\-_]+/);
                        
                        let matchScore = 0;
                        
                        // Direct matches (highest priority)
                        if (imgUrl.includes(value)) matchScore += 100; // Exact code match
                        if (imgUrl.includes(`${originalSku}.${value}`) || imgUrl.includes(`${originalSku}-${value}`)) matchScore += 90;
                        
                        // Filename pattern matches
                        if (imgLower.includes(finishLower)) matchScore += 80;
                        
                        // Individual word matches in filename
                        finishWords.forEach(word => {
                            if (word.length > 2 && imgLower.includes(word)) {
                                matchScore += 30; // Each word match
                            }
                        });
                        
                        // Common finish pattern matches
                        if (finishLower.includes('black') && (imgLower.includes('black') || imgLower.includes('blk') || imgLower.includes('_02') || imgLower.includes('-02'))) matchScore += 70;
                        if (finishLower.includes('chrome') && (imgLower.includes('chrome') || imgLower.includes('chr') || imgLower.includes('_00') || imgLower.includes('-00'))) matchScore += 70;
                        if (finishLower.includes('brass') && (imgLower.includes('brass') || imgLower.includes('brs'))) matchScore += 70;
                        if (finishLower.includes('bronze') && (imgLower.includes('bronze') || imgLower.includes('brz'))) matchScore += 70;
                        if (finishLower.includes('gold') && (imgLower.includes('gold') || imgLower.includes('gld'))) matchScore += 70;
                        if (finishLower.includes('platinum') && (imgLower.includes('platinum') || imgLower.includes('plt'))) matchScore += 70;
                        if (finishLower.includes('nickel') && (imgLower.includes('nickel') || imgLower.includes('nkl'))) matchScore += 70;
                        
                        // Store best match
                        if (matchScore > bestMatchScore) {
                            bestMatchScore = matchScore;
                            bestImageMatch = imgUrl;
                        }
                    }
                    
                    // Use best match if score is good enough
                    if (bestMatchScore >= 30) {
                        colorImage = bestImageMatch;
                        console.log(`Found image for ${finishName}: ${colorImage} (score: ${bestMatchScore})`);
                    } else {
                        console.log(`No good image match found for ${finishName} (best score: ${bestMatchScore})`);
                    }
                }
                
                // Try to extract hex color from website or use simple defaults
                let hexColor = '#CCCCCC'; // Default gray
                
                // Simple color detection based on finish name
                const finishLower = finishName.toLowerCase();
                if (finishLower.includes('black')) hexColor = '#1C1C1C';
                else if (finishLower.includes('white')) hexColor = '#FFFFFF';
                else if (finishLower.includes('chrome') || finishLower.includes('silver')) hexColor = '#C0C0C0';
                else if (finishLower.includes('gold')) hexColor = '#D4AF37';
                else if (finishLower.includes('brass')) hexColor = '#B87333';
                else if (finishLower.includes('bronze')) hexColor = '#8C7853';
                else if (finishLower.includes('copper')) hexColor = '#B87333';
                else if (finishLower.includes('nickel')) hexColor = '#727472';
                else if (finishLower.includes('platinum')) hexColor = '#E5E4E2';
                
                console.log(`Color for ${finishName}: ${hexColor}`);
                
                // Generate EL- prefixed SKU and keep original
                const originalVariantSku = originalSku + '.' + value.padStart(2, '0');
                const variantTimestamp = Date.now().toString().slice(-6);
                const variantRandomNum = Math.floor(Math.random() * 100).toString().padStart(2, '0');
                const newSku = `EL-${variantTimestamp}${variantRandomNum}`;
                
                // Set consistent pricing structure
                const costPrice = variantPrice; // This is the supplier cost
                const regularPrice = Math.round(variantPrice * 0.95 * 100) / 100; // 5% off the cost price
                
                variations.push({
                    name: finishName,
                    finish: finishName,
                    sku: newSku,
                    originalSku: originalVariantSku,
                    cost_price: costPrice, // Supplier cost price
                    price: regularPrice, // Your selling price (cost + markup)
                    code: value,
                    image: colorImage,
                    hex: hexColor
                });
                
                console.log('Added variation:', finishName, 'SKU:', newSku, 'Original:', originalSku, 'Image:', colorImage ? 'Found' : 'None');
                }
            });
        });
        

        // Method 2: If no variations found, extract from text content with realistic pricing
        if (variations.length === 0) {
            const finishPricing = {
                'Chrome': { price: price, code: '00' },
                'Matt Black': { price: price + 25, code: '02' },
                'Brushed Platinum': { price: price + 15, code: '01' },
                'Aged Brass': { price: price + 35, code: '05' },
                'Brushed Gold': { price: price + 30, code: '04' },
                'Gun Metal': { price: price + 20, code: '03' }
            };
            
            Object.entries(finishPricing).forEach(([finish, data]) => {
                if (html.toLowerCase().includes(finish.toLowerCase())) {
                    const originalVariantSku2 = originalSku + '.' + data.code;
                    const variantTimestamp2 = Date.now().toString().slice(-6);
                    const variantRandomNum2 = Math.floor(Math.random() * 100).toString().padStart(2, '0');
                    const newSku = `EL-${variantTimestamp2}${variantRandomNum2}`;
                    
                    variations.push({
                        name: finish,
                        finish: finish,
                        sku: newSku,
                        originalSku: originalVariantSku2,
                        price: data.price,
                        code: data.code,
                        image: null
                    });
                }
            });
        }
        
        // Enhanced JavaScript analysis will be done after extracting script content
        /* Commented out orphaned code block - needs fixing
            for (const match of matches) {
                try {
                    console.log(`Array pattern match:`, match[0].substring(0, 200) + '...');
                    
                    // Try to extract individual objects from the array
                    const objectsInArray = match[0].match(/\{[^}]+\}/g);
                    if (objectsInArray) {
                        objectsInArray.forEach(objStr => {
                            console.log('Processing object:', objStr);
                            
                            // Look for color and price in the same object
                            const colorMatch = objStr.match(/["']?(black|chrome|brass|nickel|gold|platinum|gunmetal|gun-metal)["']?/i);
                            const priceMatch = objStr.match(/["']?(\d+(?:\.\d+)?)["']?/);
                            
                            if (colorMatch && priceMatch) {
                                const color = colorMatch[1].toLowerCase();
                                const priceValue = parseFloat(priceMatch[1]);
                                
                                if (priceValue > 50 && priceValue < 10000) {
                                    colorPriceMappings[color] = priceValue;
                                    console.log(`Found array mapping: ${color} = $${priceValue}`);
                                }
                            }
                        });
                    }
                } catch (e) {
                    console.log('Error parsing array pattern:', e.message);
                }
            }
        });
        */ // End of commented out orphaned code block
        
        /* Pattern 3: Look for event handlers that change prices on select - also needs fixing
        const eventHandlerPatterns = [
            /on(?:change|click).*?(?:price|amount).*?(\d+(?:\.\d+)?)/gi,
            /(?:price|amount).*?=.*?(\d+(?:\.\d+)?)/gi,
            /updatePrice.*?(\d+(?:\.\d+)?)/gi
        ];
        
        eventHandlerPatterns.forEach((pattern, patternIndex) => {
            console.log(`Trying event handler pattern ${patternIndex + 1}...`);
            const matches = allScriptContent.matchAll(pattern);
            for (const match of matches) {
                const priceValue = parseFloat(match[1]);
                if (priceValue > 50 && priceValue < 10000 && priceValue !== price) {
                    console.log(`Found event handler price: $${priceValue} (context: ${match[0].substring(0, 100)}...)`);
                    // Store this as a potential alternate price
                    if (Object.keys(colorPriceMappings).length === 0) {
                        colorPriceMappings['variant'] = priceValue;
                    }
                }
            }
        });
        
        console.log('Final color-price mappings found:', colorPriceMappings);
        
        // Pattern 4: Look for specific WooCommerce variation data
        const wooVariationPatterns = [
            /product_variations\s*=\s*(\[.*?\])/gs,
            /available_variations\s*=\s*(\[.*?\])/gs,
            /variation_data\s*=\s*(\{.*?\})/gs
        ];
        
        wooVariationPatterns.forEach((pattern, patternIndex) => {
            console.log(`Trying WooCommerce pattern ${patternIndex + 1}...`);
            const matches = allScriptContent.matchAll(pattern);
            for (const match of matches) {
                try {
                    console.log(`WooCommerce match found, length: ${match[1].length} chars`);
                    console.log('Sample:', match[1].substring(0, 300) + '...');
                    
                    const variationData = JSON.parse(match[1]);
                    console.log('Parsed WooCommerce data:', typeof variationData, Array.isArray(variationData) ? variationData.length : 'object');
                    
                    if (Array.isArray(variationData)) {
                        variationData.forEach((variation, index) => {
                            console.log(`Variation ${index}:`, {
                                attributes: variation.attributes,
                                price: variation.display_price || variation.price,
                                variation_id: variation.variation_id
                            });
                            
                            if (variation.display_price && variation.attributes) {
                                const attrs = variation.attributes;
                                const varPrice = parseFloat(variation.display_price);
                                
                                // Extract color from attributes
                                Object.values(attrs).forEach(attrValue => {
                                    if (attrValue && typeof attrValue === 'string') {
                                        const colorKey = attrValue.toLowerCase().trim();
                                        if (varPrice > 50 && varPrice < 10000) {
                                            colorPriceMappings[colorKey] = varPrice;
                                            console.log(`WooCommerce mapping: ${colorKey} = $${varPrice}`);
                                        }
                                    }
                                });
                            }
                        });
                    }
                } catch (e) {
                    console.log('Error parsing WooCommerce data:', e.message);
                    console.log('Raw data preview:', match[1].substring(0, 200));
                }
            }
        });
        
        console.log('Enhanced color-price mappings found:', colorPriceMappings);
        */ // End of commented problematic code
        
        /* Commenting out more problematic code that uses allScriptContent before it's defined
        // Look for common WooCommerce/eCommerce price variation patterns and dynamic price data
        const variationPricePatterns = [
            /"price":\s*"?([\d.]+)"?/g,
            /"regular_price":\s*"?([\d.]+)"?/g,
            /"variation_id":\s*(\d+).*?"price":\s*"?([\d.]+)"?/g,
            /variation[_-]prices?['"]\s*:\s*\{([^}]+)\}/gi,
            /price[_-]data['"]\s*:\s*\{([^}]+)\}/gi,
            // Enhanced patterns for dynamic pricing
            /wc_single_product_params.*?price_display_suffix/gs,
            /variations_form.*?available_variations/gs,
            /product_variations\s*=\s*(\[.*?\]);?/gs,
            // Look for finish-specific pricing patterns
            /([a-zA-Z\s-]+)["']?\s*:\s*["']?([\d.]+)["']?/g,
            // Abey-specific patterns
            /finish.*?price.*?([\d.]+)/gi,
            /color.*?price.*?([\d.]+)/gi
        ];
        
        let jsVariationPrices = {};
        variationPricePatterns.forEach(pattern => {
            const matches = allScriptContent.matchAll(pattern);
            for (const match of matches) {
                if (match[1] && match[2]) {
                    jsVariationPrices[match[1]] = parseFloat(match[2]);
                } else if (match[1]) {
                    const priceValue = parseFloat(match[1]);
                    if (priceValue > 0) {
                        jsVariationPrices[`price_${Object.keys(jsVariationPrices).length}`] = priceValue;
                    }
                }
            }
        });
        
        console.log('JavaScript price data found:', Object.keys(jsVariationPrices).length, 'prices');
        
        // Method 5: Look for WooCommerce variation data (common pattern)
        const variationDataMatch = allScriptContent.match(/product_variations\s*:\s*(\[.*?\])/s);
        if (variationDataMatch) {
            try {
                const variationData = JSON.parse(variationDataMatch[1]);
                console.log('Found WooCommerce variation data:', variationData.length, 'variations');
                
                variationData.forEach((variation, index) => {
                    if (variation.display_price && variation.attributes) {
                        const variantPrice = parseFloat(variation.display_price) || price;
                        const attributes = variation.attributes;
                        
                        // Extract finish name from attributes
                        let finishName = 'Variant ' + (index + 1);
                        Object.values(attributes).forEach(attrValue => {
                            if (attrValue && typeof attrValue === 'string' && attrValue.length < 50) {
                                finishName = attrValue;
                            }
                        });
                        
                        if (variantPrice !== price || variations.length === 0) {
                            const variantTimestamp = Date.now().toString().slice(-6);
                            const variantRandomNum = Math.floor(Math.random() * 100).toString().padStart(2, '0');
                            const newSku = `EL-${variantTimestamp}${variantRandomNum}`;
                            
                            // Detect color
                            let hexColor = '#CCCCCC';
                            const finishLower = finishName.toLowerCase();
                            if (finishLower.includes('black')) hexColor = '#1C1C1C';
                            else if (finishLower.includes('white')) hexColor = '#FFFFFF';
                            else if (finishLower.includes('chrome') || finishLower.includes('silver')) hexColor = '#C0C0C0';
                            else if (finishLower.includes('gold')) hexColor = '#D4AF37';
                            else if (finishLower.includes('brass')) hexColor = '#B87333';
                            else if (finishLower.includes('bronze')) hexColor = '#8C7853';
                            else if (finishLower.includes('platinum')) hexColor = '#E5E4E2';
                            else if (finishLower.includes('nickel')) hexColor = '#727472';
                            
                            variations.push({
                                name: finishName,
                                finish: finishName,
                                sku: newSku,
                                originalSku: `${originalSku}.${String(index).padStart(2, '0')}`,
                                cost_price: variantPrice,
                                price: Math.round(variantPrice * 0.95 * 100) / 100, // 5% off
                                code: variation.variation_id || String(index),
                                image: variation.image?.src || null,
                                hex: hexColor
                            });
                            
                            console.log(`Found WooCommerce variation: ${finishName} at $${variantPrice}`);
                        }
                    }
                });
            } catch (e) {
                console.log('Error parsing WooCommerce variation data:', e.message);
            }
        }
        
        // If we found JS price data but no variations from selects, try to match them
        if (Object.keys(jsVariationPrices).length > 0 && variations.length === 0) {
            console.log('No select-based variations found, but JS prices available. Creating variations from JS data...');
            
            Object.entries(jsVariationPrices).forEach(([key, jsPrice], index) => {
                if (jsPrice && jsPrice > 0 && jsPrice !== price) {
                    const variantTimestamp = Date.now().toString().slice(-6);
                    const variantRandomNum = Math.floor(Math.random() * 100).toString().padStart(2, '0');
                    const newSku = `EL-${variantTimestamp}${variantRandomNum}`;
                    
                    variations.push({
                        name: `Variant ${index + 1}`,
                        finish: `Variant ${index + 1}`,
                        sku: newSku,
                        originalSku: `${originalSku}.${String(index).padStart(2, '0')}`,
                        cost_price: jsPrice,
                        price: Math.round(jsPrice * 0.95 * 100) / 100,
                        code: String(index),
                        image: null,
                        hex: '#CCCCCC'
                    });
                }
            });
        }
        */ // End of commented problematic code - all references to allScriptContent before it's defined
        
        // Method 3: Look for price tables or lists with finish/price combinations
        console.log('Checking for price tables and finish lists...');
        
        // Look for tables with finish and price columns
        $('table tr').each((i, row) => {
            const $row = $(row);
            const cells = $row.find('td, th');
            
            if (cells.length >= 2) {
                const firstCell = $(cells[0]).text().trim();
                const secondCell = $(cells[1]).text().trim();
                
                // Check if first cell looks like a finish name and second like a price
                const priceMatch = secondCell.match(/\$?([\d,.]+)/);
                const isFinishName = /chrome|black|brass|bronze|gold|platinum|nickel|finish/i.test(firstCell);
                
                if (isFinishName && priceMatch) {
                    const finishPrice = parseFloat(priceMatch[1].replace(/,/g, ''));
                    
                    if (finishPrice > 0 && finishPrice !== price) {
                        const variantTimestamp = Date.now().toString().slice(-6);
                        const variantRandomNum = Math.floor(Math.random() * 100).toString().padStart(2, '0');
                        const newSku = `EL-${variantTimestamp}${variantRandomNum}`;
                        
                        // Simple color detection for this finish
                        let hexColor = '#CCCCCC';
                        const finishLower = firstCell.toLowerCase();
                        if (finishLower.includes('black')) hexColor = '#1C1C1C';
                        else if (finishLower.includes('white')) hexColor = '#FFFFFF';
                        else if (finishLower.includes('chrome') || finishLower.includes('silver')) hexColor = '#C0C0C0';
                        else if (finishLower.includes('gold')) hexColor = '#D4AF37';
                        else if (finishLower.includes('brass')) hexColor = '#B87333';
                        else if (finishLower.includes('bronze')) hexColor = '#8C7853';
                        else if (finishLower.includes('platinum')) hexColor = '#E5E4E2';
                        else if (finishLower.includes('nickel')) hexColor = '#727472';
                        
                        variations.push({
                            name: firstCell,
                            finish: firstCell,
                            sku: newSku,
                            originalSku: `${originalSku}.${String(variations.length).padStart(2, '0')}`,
                            cost_price: finishPrice,
                            price: Math.round(finishPrice * 0.95 * 100) / 100, // 5% off
                            code: String(variations.length),
                            image: null, // Will be matched later
                            hex: hexColor
                        });
                        
                        console.log(`Found table variation: ${firstCell} at $${finishPrice}`);
                    }
                }
            }
        });
        
        // Method 4: Look for bullet lists with finish and price
        $('.product-options li, .finish-options li, .color-options li, .price-list li').each((i, li) => {
            const $li = $(li);
            const text = $li.text().trim();
            
            // Look for patterns like "Chrome - $308" or "Matt Black: $358"
            const finishPriceMatch = text.match(/([^$:-]+)[\s:-]+\$?([\d,.]+)/);
            if (finishPriceMatch) {
                const finishName = finishPriceMatch[1].trim();
                const finishPrice = parseFloat(finishPriceMatch[2].replace(/,/g, ''));
                
                if (finishPrice > 0 && finishName.length > 2) {
                    const variantTimestamp = Date.now().toString().slice(-6);
                    const variantRandomNum = Math.floor(Math.random() * 100).toString().padStart(2, '0');
                    const newSku = `EL-${variantTimestamp}${variantRandomNum}`;
                    
                    // Simple color detection
                    let hexColor = '#CCCCCC';
                    const finishLower = finishName.toLowerCase();
                    if (finishLower.includes('black')) hexColor = '#1C1C1C';
                    else if (finishLower.includes('white')) hexColor = '#FFFFFF';
                    else if (finishLower.includes('chrome') || finishLower.includes('silver')) hexColor = '#C0C0C0';
                    else if (finishLower.includes('gold')) hexColor = '#D4AF37';
                    else if (finishLower.includes('brass')) hexColor = '#B87333';
                    else if (finishLower.includes('bronze')) hexColor = '#8C7853';
                    else if (finishLower.includes('platinum')) hexColor = '#E5E4E2';
                    else if (finishLower.includes('nickel')) hexColor = '#727472';
                    
                    variations.push({
                        name: finishName,
                        finish: finishName,
                        sku: newSku,
                        originalSku: `${originalSku}.${String(variations.length).padStart(2, '0')}`,
                        cost_price: finishPrice,
                        price: Math.round(finishPrice * 0.95 * 100) / 100, // 5% off
                        code: String(variations.length),
                        image: null,
                        hex: hexColor
                    });
                    
                    console.log(`Found list variation: ${finishName} at $${finishPrice}`);
                }
            }
        });
        
        console.log('Found variations:', variations.length);
        
        // Extract specifications from tables or lists
        console.log('Extracting specifications...');
        const specifications = {};
        $('.woocommerce-product-attributes tr, .product-specs tr').each((i, row) => {
            const $row = $(row);
            const key = $row.find('th, .spec-name, td:first').text().trim();
            const value = $row.find('td:last, .spec-value').text().trim();
            
            if (key && value && key !== value) {
                specifications[key] = value;
            }
        });
        
        // If no specifications found but we have documents, add document links to specifications
        if (Object.keys(specifications).length === 0 && documents.length > 0) {
            console.log('No specifications found, adding document links to specifications...');
            documents.forEach((doc, index) => {
                // Only include actual PDF documents, skip generic page links
                if (doc.url && doc.url !== '#' && doc.url.startsWith('http') && doc.url.toLowerCase().includes('.pdf')) {
                    const docType = doc.name || `Document ${index + 1}`;
                    
                    // Use direct PDF URLs that open in browser's built-in PDF viewer
                    const viewableUrl = doc.url;
                    
                    specifications[docType] = viewableUrl;
                    console.log(`Added PDF document to specs: ${docType} -> ${viewableUrl}`);
                }
            });
        }
        
        // Enhanced auto-category detection with comprehensive matching
        const autoCategories = [];
        const categorySearchText = `${productName} ${shortDesc} ${longDesc} ${brand} ${url}`.toLowerCase();
        
        console.log('Auto-categorizing product:', productName);
        console.log('Search text preview:', categorySearchText.substring(0, 200));
        
        // TAPWARE DETECTION (Most specific first)
        if (categorySearchText.includes('basin mixer') || categorySearchText.includes('basin tap')) {
            autoCategories.push('141'); // Basin Mixers
            autoCategories.push('140'); // Tapware
            autoCategories.push('100'); // Bathrooms
            console.log('Detected: Basin Mixer');
        } else if (categorySearchText.includes('tall basin') || categorySearchText.includes('vessel basin')) {
            autoCategories.push('142'); // Tall Basin Mixers
            autoCategories.push('140'); // Tapware  
            autoCategories.push('100'); // Bathrooms
            console.log('Detected: Tall Basin Mixer');
        } else if (categorySearchText.includes('freestanding bath') || categorySearchText.includes('floor mount')) {
            autoCategories.push('143'); // Freestanding Bath Mixers
            autoCategories.push('140'); // Tapware
            autoCategories.push('100'); // Bathrooms
            console.log('Detected: Freestanding Bath Mixer');
        } else if (categorySearchText.includes('wall spout') || categorySearchText.includes('bath spout') || categorySearchText.includes('wall mixer')) {
            autoCategories.push('144'); // Bath Spout & Wall Mixers
            autoCategories.push('140'); // Tapware
            autoCategories.push('100'); // Bathrooms
            console.log('Detected: Bath Spout & Wall Mixers');
        } else if (categorySearchText.includes('diverter') || categorySearchText.includes('wall mixer.*divert')) {
            autoCategories.push('145'); // Wall Mixers With Diverters
            autoCategories.push('140'); // Tapware
            autoCategories.push('100'); // Bathrooms
            console.log('Detected: Wall Mixer with Diverter');
        } else if (categorySearchText.includes('three piece') && categorySearchText.includes('wall')) {
            autoCategories.push('146'); // Wall Three Piece Sets
            autoCategories.push('140'); // Tapware
            autoCategories.push('100'); // Bathrooms
            console.log('Detected: Wall Three Piece Set');
        } else if (categorySearchText.includes('three piece') && categorySearchText.includes('counter')) {
            autoCategories.push('147'); // Counter Top Three Piece Sets
            autoCategories.push('140'); // Tapware
            autoCategories.push('100'); // Bathrooms
            console.log('Detected: Counter Top Three Piece Set');
        } else if (categorySearchText.includes('shower mixer') || categorySearchText.includes('shower tap')) {
            autoCategories.push('126'); // Shower Mixers
            autoCategories.push('120'); // Showerware
            autoCategories.push('100'); // Bathrooms
            console.log('Detected: Shower Mixer');
        } else if (categorySearchText.includes('tapware') || categorySearchText.includes('mixer') || categorySearchText.includes('spout')) {
            autoCategories.push('140'); // Tapware (generic)
            autoCategories.push('100'); // Bathrooms
            console.log('Detected: Generic Tapware');
        }
        
        // BATHROOM ACCESSORIES DETECTION
        if (categorySearchText.includes('towel rail') && !categorySearchText.includes('heated')) {
            autoCategories.push('111'); // Towel Rails
            autoCategories.push('110'); // Bathroom Accessories
            autoCategories.push('100'); // Bathrooms
            console.log('Detected: Towel Rail');
        } else if (categorySearchText.includes('heated towel') || categorySearchText.includes('towel warmer')) {
            autoCategories.push('112'); // Heated Towel Rails
            autoCategories.push('110'); // Bathroom Accessories
            autoCategories.push('100'); // Bathrooms
            console.log('Detected: Heated Towel Rail');
        } else if (categorySearchText.includes('robe hook') || categorySearchText.includes('hook')) {
            autoCategories.push('113'); // Robe Hooks
            autoCategories.push('110'); // Bathroom Accessories
            autoCategories.push('100'); // Bathrooms
            console.log('Detected: Robe Hook');
        } else if (categorySearchText.includes('soap dish') || categorySearchText.includes('soap holder') || categorySearchText.includes('shelf')) {
            autoCategories.push('115'); // Soap Dish Holders and Shelves
            autoCategories.push('110'); // Bathroom Accessories
            autoCategories.push('100'); // Bathrooms
            console.log('Detected: Soap Dish/Shelf');
        }
        
        // SHOWERWARE DETECTION
        if (categorySearchText.includes('rain shower') || categorySearchText.includes('shower head') || categorySearchText.includes('shower arm')) {
            autoCategories.push('125'); // Rain Shower & Arms
            autoCategories.push('120'); // Showerware
            autoCategories.push('100'); // Bathrooms
            console.log('Detected: Rain Shower/Head');
        } else if (categorySearchText.includes('hand held shower') || categorySearchText.includes('handheld')) {
            autoCategories.push('122'); // Hand Held Showers
            autoCategories.push('120'); // Showerware
            autoCategories.push('100'); // Bathrooms
            console.log('Detected: Hand Held Shower');
        } else if (categorySearchText.includes('shower rail') || categorySearchText.includes('rail')) {
            autoCategories.push('121'); // Shower on Rails
            autoCategories.push('120'); // Showerware
            autoCategories.push('100'); // Bathrooms
            console.log('Detected: Shower on Rails');
        }
        
        // BASIN DETECTION
        if (categorySearchText.includes('above counter') || categorySearchText.includes('vessel basin')) {
            autoCategories.push('161'); // Above Counter Basins
            autoCategories.push('160'); // Basins
            autoCategories.push('100'); // Bathrooms
            console.log('Detected: Above Counter Basin');
        } else if (categorySearchText.includes('under counter') || categorySearchText.includes('undermount')) {
            autoCategories.push('162'); // Under Counter Basins
            autoCategories.push('160'); // Basins
            autoCategories.push('100'); // Bathrooms
            console.log('Detected: Under Counter Basin');
        } else if (categorySearchText.includes('wall hung basin') || categorySearchText.includes('wall mount.*basin')) {
            autoCategories.push('163'); // Wall Hung Basins
            autoCategories.push('160'); // Basins
            autoCategories.push('100'); // Bathrooms
            console.log('Detected: Wall Hung Basin');
        } else if (categorySearchText.includes('basin') || categorySearchText.includes('sink')) {
            autoCategories.push('160'); // Basins (generic)
            autoCategories.push('100'); // Bathrooms
            console.log('Detected: Generic Basin');
        }
        
        // GLASS FENCING DETECTION
        if (categorySearchText.includes('pool fence') && categorySearchText.includes('glass')) {
            autoCategories.push('310'); // Frameless Glass Pool Fencing
            autoCategories.push('300'); // Glass Fencing
            console.log('Detected: Glass Pool Fencing');
        } else if (categorySearchText.includes('balustrade') && categorySearchText.includes('glass')) {
            autoCategories.push('330'); // Frameless Glass Balustrades
            autoCategories.push('300'); // Glass Fencing
            console.log('Detected: Glass Balustrade');
        } else if (categorySearchText.includes('shower screen') && categorySearchText.includes('glass')) {
            autoCategories.push('350'); // Frameless Glass Shower Screens
            autoCategories.push('300'); // Glass Fencing
            console.log('Detected: Glass Shower Screen');
        }
        
        // ALUMINIUM FENCING DETECTION
        if (categorySearchText.includes('pool fence') && categorySearchText.includes('aluminium')) {
            autoCategories.push('410'); // Aluminium Pool Fencing
            autoCategories.push('400'); // Aluminium Fencing
            console.log('Detected: Aluminium Pool Fencing');
        } else if (categorySearchText.includes('balustrade') && categorySearchText.includes('aluminium')) {
            autoCategories.push('420'); // Aluminium Balustrades
            autoCategories.push('400'); // Aluminium Fencing
            console.log('Detected: Aluminium Balustrade');
        }
        
        // TILES DETECTION
        if (categorySearchText.includes('bathroom.*tile') || (categorySearchText.includes('tile') && categorySearchText.includes('bathroom'))) {
            autoCategories.push('511'); // Bathroom Tiles
            autoCategories.push('510'); // Tiles
            autoCategories.push('500'); // Flooring
            console.log('Detected: Bathroom Tiles');
        } else if (categorySearchText.includes('kitchen.*tile') || categorySearchText.includes('laundry.*tile')) {
            autoCategories.push('512'); // Kitchen/Laundry Tiles
            autoCategories.push('510'); // Tiles
            autoCategories.push('500'); // Flooring
            console.log('Detected: Kitchen/Laundry Tiles');
        } else if (categorySearchText.includes('pool.*tile') || categorySearchText.includes('swimming.*pool')) {
            autoCategories.push('516'); // Pool Tiles
            autoCategories.push('510'); // Tiles
            autoCategories.push('500'); // Flooring
            console.log('Detected: Pool Tiles');
        } else if (categorySearchText.includes('tile')) {
            autoCategories.push('510'); // Tiles (generic)
            autoCategories.push('500'); // Flooring
            console.log('Detected: Generic Tiles');
        }
        
        // COMPOSITE DETECTION
        if (categorySearchText.includes('composite.*deck') || categorySearchText.includes('deck')) {
            autoCategories.push('530'); // Composite Decking
            autoCategories.push('500'); // Flooring
            console.log('Detected: Composite Decking');
        } else if (categorySearchText.includes('composite.*clad') || categorySearchText.includes('cladding')) {
            autoCategories.push('600'); // Composite Cladding
            console.log('Detected: Composite Cladding');
        }
        
        // VANITY DETECTION
        if (categorySearchText.includes('wall hung.*vanity') || categorySearchText.includes('wall mount.*vanity')) {
            autoCategories.push('151'); // Wall Hung Vanities
            autoCategories.push('150'); // Vanities
            autoCategories.push('100'); // Bathrooms
            console.log('Detected: Wall Hung Vanity');
        } else if (categorySearchText.includes('floor.*vanity') || categorySearchText.includes('freestanding.*vanity')) {
            autoCategories.push('152'); // Floor Standing Vanities
            autoCategories.push('150'); // Vanities
            autoCategories.push('100'); // Bathrooms
            console.log('Detected: Floor Standing Vanity');
        } else if (categorySearchText.includes('vanity')) {
            autoCategories.push('150'); // Vanities (generic)
            autoCategories.push('100'); // Bathrooms
            console.log('Detected: Generic Vanity');
        }
        
        console.log('Final auto-detected categories:', autoCategories);
        
        // Filter images to get product-specific ones
        const productImages = images.filter(img => img.includes(originalSku));
        const mainImage = productImages[0] || images[0];
        
        // Calculate main product pricing consistently
        const mainProductCostPrice = price;
        const mainProductRegularPrice = Math.round(price * 0.95 * 100) / 100; // 5% off the cost price
        
        const productData = {
            name: productName,
            sku: elSku, // Sequential EL- SKU (e.g., EL-12345601)
            originalSku: originalSku, // Keep original manufacturer SKU
            short_description: shortDesc,
            long_description: longDesc,
            brand: brand,
            manufacturer: brand,
            price: mainProductRegularPrice, // Your selling price (cost + markup)
            cost_price: mainProductCostPrice, // Supplier cost price
            specifications: specifications,
            colors: variations.map(v => v.name),
            colorVariants: variations, // Enhanced with images and individual SKUs
            variations: variations,
            images: images,
            main_image: mainImage,
            gallery_images: productImages.slice(1, 4) || [],
            documents: documents, // Include extracted downloadable files
            autoCategories: autoCategories, // Auto-detected categories
            sourceUrl: url
        };
        
        console.log('Final product data summary:');
        console.log('- Name:', productData.name);
        console.log('- Short description length:', productData.short_description?.length || 0);
        console.log('- Long description length:', productData.long_description?.length || 0);
        console.log('- Images found:', productData.images?.length || 0);
        console.log('- Documents found:', productData.documents?.length || 0);
        console.log('- Variations found:', productData.variations?.length || 0);
        console.log('- Specifications found:', Object.keys(productData.specifications || {}).length);
        
        res.json({
            success: true,
            data: productData
        });
        
    } catch (error) {
        console.error('Scraping error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to scrape product data',
            details: error.message
        });
    }
});

// AI Description Enhancement for SEO
// Test endpoint for AI description generation
router.post('/test-ai-description', async (req, res) => {
    try {
        console.log('Testing AI description generation...');
        
        const testPageContent = {
            title: 'Test Product - Premium Basin Mixer',
            headings: ['Premium Quality', 'Australian Standards', 'Modern Design'],
            metaDescription: 'High quality basin mixer for luxury bathrooms',
            specifications: { 'Material': 'Brass', 'Finish': 'Chrome', 'Warranty': '10 years' },
            features: ['Ceramic disc cartridge', 'Water efficient', 'Easy installation'],
            allText: 'Premium basin mixer with modern design and superior quality.'
        };
        
        const description = await generateAIDescription('Test Basin Mixer', testPageContent, 'Astra Walker');
        
        res.json({
            success: true,
            description: description,
            length: description ? description.length : 0
        });
        
    } catch (error) {
        console.error('Test AI description error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.post('/enhance-description', async (req, res) => {
    const { text, type, productName, productCategory } = req.body;
    
    if (!text) {
        return res.status(400).json({
            success: false,
            error: 'Text is required'
        });
    }
    
    try {
        let enhanced = text;
        let brand = ''; // Extract from context if needed
        
        // SEO-focused enhancement based on type
        switch (type) {
            case 'enhance':
                enhanced = `${productName} - Premium ${brand || 'Australian'} ${productCategory || 'home solution'}. ${text} Features superior quality construction with professional-grade materials. Perfect for modern Australian homes seeking luxury and durability. Available in multiple finishes to complement any design aesthetic.`;
                break;
                
            case 'shorten':
                enhanced = text.split('.')[0] + `. Premium ${brand || 'Australian'} quality with modern design.`;
                break;
                
            case 'rewrite':
                enhanced = `Discover the ${productName} - a premium ${productCategory || 'product'} designed for discerning Australian homeowners. ${text.split('.').slice(1).join('. ')} Engineered for excellence and built to last.`;
                break;
                
            case 'paraphrase':
                enhanced = text.replace(/\b(premium|quality|superior|excellent)\b/gi, 'exceptional')
                              .replace(/\b(modern|contemporary)\b/gi, 'cutting-edge')
                              .replace(/\b(durable|lasting)\b/gi, 'long-lasting');
                break;
                
            default:
                enhanced = text;
        }
        
        res.json({
            success: true,
            data: { enhanced }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to enhance description'
        });
    }
});

// AI Description Generation with SEO Focus using OpenRouter
async function generateAIDescription(productName, pageContent, brand) {
    try {
        console.log('Generating SEO-optimized AI description using OpenRouter...');
        
        // Create a comprehensive context for AI generation
        const context = {
            productName,
            brand: brand || 'Premium',
            title: pageContent.title,
            headings: pageContent.headings.slice(0, 5),
            specifications: Object.keys(pageContent.specifications).slice(0, 10),
            features: pageContent.features.slice(0, 8),
            metaDescription: pageContent.metaDescription
        };
        
        // Determine product category for better SEO
        let category = 'luxury home solution';
        const contextText = JSON.stringify(context).toLowerCase();
        
        if (contextText.includes('tap') || contextText.includes('mixer') || contextText.includes('faucet')) {
            category = 'premium tapware';
        } else if (contextText.includes('basin') || contextText.includes('sink')) {
            category = 'designer basin';
        } else if (contextText.includes('shower')) {
            category = 'luxury shower solution';
        } else if (contextText.includes('toilet')) {
            category = 'premium toilet suite';
        } else if (contextText.includes('glass') && contextText.includes('fence')) {
            category = 'frameless glass fencing system';
        } else if (contextText.includes('balustrade')) {
            category = 'architectural balustrade solution';
        } else if (contextText.includes('tile') || contextText.includes('flooring')) {
            category = 'premium flooring solution';
        } else if (contextText.includes('deck') || contextText.includes('cladding')) {
            category = 'composite building material';
        }
        
        // Call OpenRouter API
        const openRouterKey = process.env.OPENROUTER_API_KEY;
        if (!openRouterKey) {
            console.log('❌ No OpenRouter API key found, using fallback description');
            return generateBasicDescription(productName, pageContent, brand, category);
        }
        
        console.log('✓ OpenRouter API key found, proceeding with AI generation...');
        
        const prompt = `You are an SEO expert copywriter for an Australian luxury home products company called Ecco Living. 

Write a compelling, SEO-optimized product description for the following product:

Product Name: ${productName}
Brand: ${brand || 'Premium'}
Category: ${category}
Page Title: ${pageContent.title}
Headings: ${context.headings.join(', ')}
Features: ${context.features.slice(0, 5).join(', ')}
Specifications: ${context.specifications.slice(0, 5).join(', ')}

Requirements:
1. Write 4-5 sentences (150-200 words)
2. Include SEO keywords naturally: Australian, premium, luxury, ${category}, ${brand || ''}
3. Target Australian homeowners and designers
4. Mention quality, craftsmanship, and Australian standards
5. Include availability and warranty mentions
6. Use professional but approachable tone
7. Focus on benefits and applications
8. No bullet points, flowing paragraph format

Write only the description, no extra text or formatting.`;

        console.log('Sending request to OpenRouter API...');
        console.log('API Key present:', !!openRouterKey);
        console.log('API Key length:', openRouterKey ? openRouterKey.length : 0);
        console.log('Prompt preview:', prompt.substring(0, 200) + '...');
        
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openRouterKey}`,
                'Content-Type': 'application/json',
                'X-Title': 'Ecco Living Product Scraper'
            },
            body: JSON.stringify({
                model: 'anthropic/claude-3.5-sonnet',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 300,
                temperature: 0.7
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.log(`OpenRouter API error: ${response.status} - ${response.statusText}`);
            console.log('Error response:', errorText);
            return generateBasicDescription(productName, pageContent, brand, category);
        }
        
        const data = await response.json();
        console.log('OpenRouter response structure:', {
            hasChoices: !!data.choices,
            choicesLength: data.choices?.length || 0,
            hasMessage: !!(data.choices?.[0]?.message),
            hasContent: !!(data.choices?.[0]?.message?.content)
        });
        
        const aiDescription = data.choices?.[0]?.message?.content?.trim();
        
        if (aiDescription && aiDescription.length > 50) {
            console.log('✓ Generated AI description via OpenRouter:', aiDescription.length, 'characters');
            return aiDescription;
        } else {
            console.log('OpenRouter returned insufficient content, using fallback');
            return generateBasicDescription(productName, pageContent, brand, category);
        }
        
    } catch (error) {
        console.error('AI description generation error:', error);
        return generateBasicDescription(productName, pageContent, brand, category || 'luxury home solution');
    }
}

// Generate basic description as fallback
function generateBasicDescription(productName, pageContent, brand, category) {
    console.log('Generating basic fallback description...');
    
    category = category || 'luxury home solution';
    
    // Generate basic but SEO-rich description
    let description = `Discover the ${productName} - a premium ${category} from ${brand || 'leading Australian supplier'}. `;
    description += `Engineered for Australian conditions, this ${category} combines superior craftsmanship with modern design aesthetics. `;
    description += `Perfect for luxury residential projects, commercial developments, and premium renovations across Australia. `;
    description += `Built to meet Australian standards with professional-grade materials and precision engineering. `;
    description += `Available through authorized dealers nationwide with comprehensive warranty coverage and expert installation support.`;
    
    console.log('Generated basic description:', description.length, 'characters');
    return description;
}

// Generate SEO keywords based on product context
function generateSEOKeywords(productName, category, brand, context) {
    const keywords = [];
    
    // Primary keywords from product name
    const nameWords = productName.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    keywords.push(...nameWords);
    
    // Brand keywords
    if (brand) keywords.push(brand.toLowerCase());
    
    // Category keywords
    keywords.push(...category.split(' '));
    
    // Australian market keywords
    keywords.push('australian', 'australia', 'premium', 'luxury', 'designer', 'modern');
    
    // Feature-based keywords from specifications
    if (context.specifications) {
        context.specifications.forEach(spec => {
            const specWords = spec.toLowerCase().split(/\s+/).filter(w => w.length > 3);
            keywords.push(...specWords.slice(0, 2));
        });
    }
    
    // Quality and material keywords
    keywords.push('quality', 'durable', 'professional', 'commercial', 'residential');
    
    // Remove duplicates and filter
    return [...new Set(keywords)]
        .filter(k => k.length > 2 && !['and', 'the', 'for', 'with'].includes(k))
        .slice(0, 15);
}

// Generate SEO-optimized description
function generateSEODescription(productName, category, brand, context, keywords) {
    // Primary description with main keywords
    let description = `Discover the ${productName} - a premium ${category} from ${brand || 'leading Australian supplier'}. `;
    
    // Add key features if available
    if (context.features && context.features.length > 0) {
        const topFeatures = context.features.slice(0, 3);
        description += `Featuring ${topFeatures.join(', ').toLowerCase()}, `;
    }
    
    // Add specifications context
    if (context.specifications && context.specifications.length > 0) {
        const specs = context.specifications.slice(0, 3).join(', ');
        description += `with detailed specifications including ${specs}. `;
    }
    
    // SEO-rich second paragraph with location and quality keywords
    description += `Engineered for Australian conditions, this ${category} combines superior craftsmanship with modern design aesthetics. `;
    
    // Benefits and applications
    description += `Perfect for luxury residential projects, commercial developments, and premium renovations across Australia. `;
    
    // Technical and quality assurance
    description += `Built to meet Australian standards with professional-grade materials and precision engineering. `;
    
    // Call to action with availability
    description += `Available through authorized dealers nationwide with comprehensive warranty coverage and expert installation support.`;
    
    // Naturally incorporate SEO keywords
    const keywordPhrase = keywords.slice(0, 3).join(', ');
    description += ` Key features include ${keywordPhrase} for optimal performance and longevity.`;
    
    return description;
}

// Generate AI description from PDF content
async function generateAIDescriptionFromPDF(productName, pdfContent, brand) {
    try {
        console.log('Generating description from PDF content...');
        
        // Extract key information from PDF text
        const specs = extractSpecificationsFromText(pdfContent);
        const features = extractFeaturesFromText(pdfContent);
        const dimensions = extractDimensionsFromText(pdfContent);
        
        const context = {
            specifications: Object.keys(specs),
            features: features,
            dimensions: dimensions,
            content: pdfContent.substring(0, 2000) // First 2000 chars
        };
        
        return generateSEODescription(productName, 'premium product', brand, context, 
            generateSEOKeywords(productName, 'premium product', brand, context));
            
    } catch (error) {
        console.error('PDF AI description error:', error);
        return null;
    }
}

// Extract PDF content (simplified version)
async function extractPDFContent(pdfUrl) {
    try {
        console.log('Extracting PDF content from:', pdfUrl);
        
        // For now, return a placeholder - in production you'd use pdf-parse
        // const pdfResponse = await fetch(pdfUrl);
        // const pdfBuffer = await pdfResponse.arrayBuffer();
        // const pdfData = await pdfParse(Buffer.from(pdfBuffer));
        // return pdfData.text;
        
        return `PDF content extraction not yet implemented for ${pdfUrl}`;
        
    } catch (error) {
        console.error('PDF extraction error:', error);
        return null;
    }
}

// Extract specifications from text content
function extractSpecificationsFromText(text) {
    const specs = {};
    
    // Common specification patterns
    const patterns = [
        /(?:size|dimension|width|height|depth|length)[:\s]+([^\n\r]+)/gi,
        /(?:material|finish|coating)[:\s]+([^\n\r]+)/gi,
        /(?:weight|capacity|pressure)[:\s]+([^\n\r]+)/gi,
        /(?:warranty|guarantee)[:\s]+([^\n\r]+)/gi,
        /(?:certification|standard|compliance)[:\s]+([^\n\r]+)/gi
    ];
    
    patterns.forEach(pattern => {
        const matches = text.matchAll(pattern);
        for (const match of matches) {
            const key = match[0].split(':')[0].trim();
            const value = match[1].trim();
            if (value.length > 0 && value.length < 100) {
                specs[key] = value;
            }
        }
    });
    
    return specs;
}

// Extract features from text content
function extractFeaturesFromText(text) {
    const features = [];
    
    // Look for bullet points and feature lists
    const lines = text.split(/[\n\r]+/);
    lines.forEach(line => {
        const cleanLine = line.trim();
        if (cleanLine.match(/^[•·*-]\s+/) || cleanLine.match(/^\d+\.\s+/)) {
            const feature = cleanLine.replace(/^[•·*-]\s+/, '').replace(/^\d+\.\s+/, '').trim();
            if (feature.length > 10 && feature.length < 200) {
                features.push(feature);
            }
        }
    });
    
    return features.slice(0, 10);
}

// Extract dimensions from text content
function extractDimensionsFromText(text) {
    const dimensionPatterns = [
        /(\d+(?:\.\d+)?)\s*(?:mm|cm|m|inch|in|")\s*[×x]\s*(\d+(?:\.\d+)?)\s*(?:mm|cm|m|inch|in|")/gi,
        /(?:width|w)[:\s]*(\d+(?:\.\d+)?)\s*(?:mm|cm|m|inch|in|")/gi,
        /(?:height|h)[:\s]*(\d+(?:\.\d+)?)\s*(?:mm|cm|m|inch|in|")/gi,
        /(?:depth|d|length|l)[:\s]*(\d+(?:\.\d+)?)\s*(?:mm|cm|m|inch|in|")/gi
    ];
    
    const dimensions = {};
    dimensionPatterns.forEach(pattern => {
        const matches = text.matchAll(pattern);
        for (const match of matches) {
            // Process dimension matches
            if (match[1] && match[2]) {
                dimensions.width = match[1];
                dimensions.height = match[2];
            }
        }
    });
    
    return dimensions;
}

// Function to get hex color from finish name
function getHexColorFromName(finishName) {
    const colorMap = {
        'chrome': '#C0C0C0',
        'brushed platinum': '#E5E4E2',
        'matt black': '#1C1C1C',      // Much darker black
        'matte black': '#1C1C1C',     // Alternative spelling
        'black': '#000000',           // Pure black
        'aged brass': '#B5A642',
        'brushed gold': '#D4AF37',
        'french gold': '#FFD700',
        'iron bronze': '#4A4A4A',
        'charcoal bronze': '#36454F',
        'natural brass': '#B87333',
        'english brass': '#B5A642',
        'tuscan bronze': '#6F4E37',
        'dark bronze': '#654321',
        'ultra': '#F8F8FF',
        'nickel': '#727472',
        'brushed chrome': '#BCC6CC',
        'satin chrome': '#C0C0C0',
        'ice grey': '#D3D3D3',
        'gloss black': '#0F0F0F',     // Very dark black with slight gloss
        'eco brass': '#B87333',
        'urban brass': '#CD7F32',
        'champagne brass': '#F7E7CE',
        'sydney bronze': '#8C7853',
        'burnished bronze': '#A97142',
        'gun metal': '#2C3539',
        'gunmetal': '#2C3539'         // Alternative spelling
    };
    
    const key = finishName.toLowerCase().trim();
    
    // Try exact match first
    if (colorMap[key]) {
        return colorMap[key];
    }
    
    // Try partial matches for black variations
    if (key.includes('black')) {
        return '#1C1C1C'; // Dark black for any black variant
    }
    
    // Try partial matches for common finishes
    if (key.includes('chrome')) return '#C0C0C0';
    if (key.includes('brass')) return '#B87333';
    if (key.includes('bronze')) return '#8C7853';
    if (key.includes('gold')) return '#D4AF37';
    if (key.includes('platinum')) return '#E5E4E2';
    if (key.includes('nickel')) return '#727472';
    
    return '#CCCCCC'; // Default gray if not found
}

// Enhanced scraper with browser automation for dynamic pricing
router.post('/scrape-product-dynamic', async (req, res) => {
    const { url } = req.body;
    
    console.log('🚀 DYNAMIC SCRAPER CALLED! URL:', url);
    
    if (!url) {
        return res.status(400).json({
            success: false,
            error: 'URL is required'
        });
    }
    
    let browser = null;
    try {
        console.log('🌐 Launching browser automation...');
        browser = await puppeteer.launch({ 
            headless: 'new',  // Use new headless mode
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled',
                '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            ]
        });
        
        const page = await browser.newPage();
        
        // Make browser less detectable
        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', {
                get: () => false,
            });
        });
        
        // Set user agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        // Set viewport
        await page.setViewport({ width: 1920, height: 1080 });
        
        console.log('📄 Loading page:', url);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        // Wait for the page to fully load
        await page.waitForTimeout(3000);
        
        // Extract basic product info
        const productInfo = await page.evaluate(() => {
            const name = document.querySelector('h1.product_title, h1')?.textContent?.trim() || 'Product Name';
            const basePrice = document.querySelector('.price .amount, .woocommerce-Price-amount, .price')?.textContent?.trim() || '';
            return { name, basePrice };
        });
        
        console.log('📦 Product:', productInfo.name);
        console.log('💰 Base price found:', productInfo.basePrice);
        
        // Find color/finish selectors
        const colorVariations = await page.evaluate(() => {
            const variations = [];
            
            // Look for select elements with color/finish options
            const selects = document.querySelectorAll('select');
            
            for (const select of selects) {
                const selectId = select.id || '';
                const selectClass = select.className || '';
                const parentText = select.closest('div')?.textContent?.toLowerCase() || '';
                
                // Check if this select contains color/finish options
                const isColorSelect = /color|finish|style|variation/i.test(selectId + selectClass + parentText);
                const hasColorOptions = Array.from(select.options).some(opt => 
                    /chrome|black|white|gold|brass|bronze|silver|platinum|nickel|gun.*metal/i.test(opt.textContent)
                );
                
                if ((isColorSelect || hasColorOptions) && select.options.length > 1) {
                    const options = Array.from(select.options)
                        .filter(opt => opt.value && opt.value !== '' && opt.textContent.trim() !== 'Choose an option')
                        .map(opt => ({
                            text: opt.textContent.trim(),
                            value: opt.value,
                            selected: opt.selected
                        }));
                    
                    if (options.length > 0) {
                        variations.push({
                            selectElement: select,
                            selectId: select.id,
                            selectClass: select.className,
                            options: options
                        });
                    }
                }
            }
            
            return variations;
        });
        
        console.log('🎨 Found color selects:', colorVariations.length);
        
        const dynamicPrices = [];
        
        // For each color selector, click through options and capture prices
        for (let selectIndex = 0; selectIndex < colorVariations.length; selectIndex++) {
            const colorSelect = colorVariations[selectIndex];
            console.log(`🔄 Processing select ${selectIndex + 1} with ${colorSelect.options.length} options`);
            
            for (const option of colorSelect.options) {
                try {
                    console.log(`🎯 Testing option: ${option.text} (${option.value})`);
                    
                    // Select this option (use a more robust selector)
                    if (colorSelect.selectId) {
                        await page.select(`#${colorSelect.selectId}`, option.value);
                    } else {
                        // Fallback to selecting by index if no ID
                        await page.evaluate((selectIndex, optionValue) => {
                            const selects = document.querySelectorAll('select');
                            const select = selects[selectIndex];
                            if (select) {
                                select.value = optionValue;
                                select.dispatchEvent(new Event('change', { bubbles: true }));
                            }
                        }, selectIndex, option.value);
                    }
                    
                    // Wait for price update (longer wait for slow sites)
                    await page.waitForTimeout(2000);
                    
                    // Get updated price
                    const updatedPrice = await page.evaluate(() => {
                        const priceSelectors = [
                            '.price .amount',
                            '.woocommerce-Price-amount',
                            '.price-display',
                            '.current-price',
                            '.product-price',
                            '.price',
                            '[class*="price"]',
                            '.amount'
                        ];
                        
                        for (const selector of priceSelectors) {
                            const element = document.querySelector(selector);
                            if (element && element.textContent) {
                                const text = element.textContent.trim();
                                if (text.includes('$') || text.match(/\d/)) {
                                    return text;
                                }
                            }
                        }
                        return '';
                    });
                    
                    console.log(`💰 Raw price text for ${option.text}: "${updatedPrice}"`);
                    
                    // Extract price number
                    const priceMatch = updatedPrice.match(/[\d,.]+/);
                    const priceValue = priceMatch ? parseFloat(priceMatch[0].replace(/,/g, '')) : 0;
                    
                    if (priceValue > 0) {
                        dynamicPrices.push({
                            finish: option.text,
                            code: option.value,
                            cost_price: priceValue,
                            price: Math.round(priceValue * 0.95 * 100) / 100, // 5% off
                            priceText: updatedPrice
                        });
                        
                        console.log(`✅ ${option.text}: Cost $${priceValue} → Regular: $${Math.round(priceValue * 0.95 * 100) / 100}`);
                    } else {
                        console.log(`⚠️ No valid price found for ${option.text}`);
                    }
                    
                } catch (error) {
                    console.log(`❌ Error testing ${option.text}:`, error.message);
                }
            }
        }
        
        // Get images and other data using static scraping
        console.log('📷 Extracting images...');
        const images = await page.evaluate(() => {
            const imageUrls = [];
            document.querySelectorAll('img').forEach(img => {
                const src = img.src || img.getAttribute('data-src');
                if (src && !src.includes('logo') && !src.includes('icon')) {
                    if (src.match(/\.(jpg|jpeg|png|webp)$/i)) {
                        imageUrls.push(src);
                    }
                }
            });
            return imageUrls;
        });
        
        // Extract other product data
        const productName = productInfo.name;
        const brand = url.match(/https?:\/\/(?:www\.)?([^.]+)/)?.[1] || '';
        
        const shortDesc = await page.evaluate(() => {
            return document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
        });
        
        // Generate result with dynamic prices
        const result = {
            name: productName,
            sku: `EL-${Date.now().toString().slice(-8)}`,
            originalSku: 'DYNAMIC-SCRAPE',
            short_description: shortDesc,
            brand: brand.charAt(0).toUpperCase() + brand.slice(1),
            dynamicPrices: dynamicPrices,
            colorVariants: dynamicPrices.map(dp => ({
                name: dp.finish,
                finish: dp.finish,
                cost_price: dp.cost_price,
                price: dp.price,
                code: dp.code,
                hex: getSimpleHexColor(dp.finish),
                image: findImageForFinish(images, dp.finish)
            })),
            images: images.slice(0, 15),
            main_image: images[0],
            gallery_images: images.slice(1),
            sourceUrl: url
        };
        
        res.json({
            success: true,
            data: result,
            message: `Found ${dynamicPrices.length} color variations with dynamic pricing`
        });
        
    } catch (error) {
        console.error('Dynamic scraping error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to scrape dynamic pricing: ' + error.message
        });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
});

// Helper functions for dynamic scraping
function getSimpleHexColor(finishName) {
    const finishLower = finishName.toLowerCase();
    if (finishLower.includes('black')) return '#1C1C1C';
    if (finishLower.includes('white')) return '#FFFFFF';
    if (finishLower.includes('chrome') || finishLower.includes('silver')) return '#C0C0C0';
    if (finishLower.includes('gold')) return '#D4AF37';
    if (finishLower.includes('brass')) return '#B87333';
    if (finishLower.includes('bronze')) return '#8C7853';
    if (finishLower.includes('platinum')) return '#E5E4E2';
    if (finishLower.includes('nickel')) return '#727472';
    if (finishLower.includes('gun') && finishLower.includes('metal')) return '#2C3539';
    return '#CCCCCC';
}

function findImageForFinish(images, finishName) {
    const finishLower = finishName.toLowerCase().replace(/\s+/g, '');
    
    for (const img of images) {
        const imgLower = img.toLowerCase();
        
        // Look for finish indicators in filename
        if (finishLower.includes('black') && (imgLower.includes('-b.') || imgLower.includes('_b.') || imgLower.includes('black'))) {
            return img;
        }
        if (finishLower.includes('brass') && (imgLower.includes('-bb.') || imgLower.includes('_bb.') || imgLower.includes('brass'))) {
            return img;
        }
        if (finishLower.includes('chrome') && (imgLower.includes('-c.') || imgLower.includes('_c.') || imgLower.includes('chrome'))) {
            return img;
        }
        if (finishLower.includes('nickel') && (imgLower.includes('-n.') || imgLower.includes('_n.') || imgLower.includes('nickel'))) {
            return img;
        }
        if (finishLower.includes('gun') && (imgLower.includes('-g.') || imgLower.includes('_g.') || imgLower.includes('gun'))) {
            return img;
        }
    }
    
    return null; // No specific image found
}

module.exports = router;