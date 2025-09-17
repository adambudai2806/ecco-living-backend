const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.json({
        success: true,
        data: [
            // === BATHROOMS ===
            {
                id: '100',
                name: 'Bathrooms',
                slug: 'bathrooms',
                description: 'Complete luxury bathroom solutions and fittings',
                parent_id: null,
                category_group: 'bathrooms'
            },
            
            // BATHROOM ACCESSORIES
            {
                id: '110',
                name: 'Bathroom Accessories',
                slug: 'bathroom-accessories',
                description: 'Essential bathroom accessories and fixtures',
                parent_id: '100',
                category_group: 'bathrooms'
            },
            { id: '111', name: 'Towel Rails', slug: 'towel-rails', parent_id: '110', category_group: 'bathrooms' },
            { id: '112', name: 'Heated Towel Rails', slug: 'heated-towel-rails', parent_id: '110', category_group: 'bathrooms' },
            { id: '113', name: 'Robe Hooks', slug: 'robe-hooks', parent_id: '110', category_group: 'bathrooms' },
            { id: '114', name: 'Toilet Accessories', slug: 'toilet-accessories', parent_id: '110', category_group: 'bathrooms' },
            { id: '115', name: 'Soap Dish Holders and Shelves', slug: 'soap-dish-holders-shelves', parent_id: '110', category_group: 'bathrooms' },
            
            // SHOWERWARE
            {
                id: '120',
                name: 'Showerware',
                slug: 'showerware',
                description: 'Shower heads, rails and shower accessories',
                parent_id: '100',
                category_group: 'bathrooms'
            },
            { id: '121', name: 'Shower on Rails', slug: 'shower-on-rails', parent_id: '120', category_group: 'bathrooms' },
            { id: '122', name: 'Hand Held Showers', slug: 'hand-held-showers', parent_id: '120', category_group: 'bathrooms' },
            { id: '123', name: 'Shower Systems', slug: 'shower-systems', parent_id: '120', category_group: 'bathrooms' },
            { id: '124', name: 'Outdoor Showers', slug: 'outdoor-showers', parent_id: '120', category_group: 'bathrooms' },
            { id: '125', name: 'Rain Shower & Arms', slug: 'rain-shower-arms', parent_id: '120', category_group: 'bathrooms' },
            { id: '126', name: 'Shower Mixers', slug: 'shower-mixers', parent_id: '120', category_group: 'bathrooms' },
            { id: '127', name: 'Wall Top Assemblies', slug: 'wall-top-assemblies', parent_id: '120', category_group: 'bathrooms' },
            
            // WASTE, TRAPS & GRATES
            {
                id: '130',
                name: 'Waste Traps & Grates',
                slug: 'waste-traps-grates',
                description: 'Drainage solutions and waste management',
                parent_id: '100',
                category_group: 'bathrooms'
            },
            { id: '131', name: 'Basin Wastes', slug: 'basin-wastes', parent_id: '130', category_group: 'bathrooms' },
            { id: '132', name: 'Bath Wastes', slug: 'bath-wastes', parent_id: '130', category_group: 'bathrooms' },
            { id: '133', name: 'Floor Strip Drains', slug: 'floor-strip-drains', parent_id: '130', category_group: 'bathrooms' },
            { id: '134', name: 'Custom Strip Drains', slug: 'custom-strip-drains', parent_id: '130', category_group: 'bathrooms' },
            { id: '135', name: 'Bottle Traps', slug: 'bottle-traps', parent_id: '130', category_group: 'bathrooms' },
            
            // TAPWARE
            {
                id: '140',
                name: 'Tapware',
                slug: 'tapware',
                description: 'Premium bathroom and kitchen tapware',
                parent_id: '100',
                category_group: 'bathrooms'
            },
            { id: '141', name: 'Basin Mixers', slug: 'basin-mixers', parent_id: '140', category_group: 'bathrooms' },
            { id: '142', name: 'Tall Basin Mixers', slug: 'tall-basin-mixers', parent_id: '140', category_group: 'bathrooms' },
            { id: '143', name: 'Freestanding Bath Mixers', slug: 'freestanding-bath-mixers', parent_id: '140', category_group: 'bathrooms' },
            { id: '144', name: 'Bath Spout & Wall Mixers', slug: 'bath-spout-wall-mixers', parent_id: '140', category_group: 'bathrooms' },
            { id: '145', name: 'Wall Mixers With Diverters', slug: 'wall-mixers-diverters', parent_id: '140', category_group: 'bathrooms' },
            { id: '146', name: 'Wall Three Piece Sets', slug: 'wall-three-piece-sets', parent_id: '140', category_group: 'bathrooms' },
            { id: '147', name: 'Counter Top Three Piece Sets', slug: 'counter-three-piece-sets', parent_id: '140', category_group: 'bathrooms' },
            
            // VANITIES
            {
                id: '150',
                name: 'Vanities',
                slug: 'vanities',
                description: 'Luxury bathroom vanity units and storage',
                parent_id: '100',
                category_group: 'bathrooms'
            },
            { id: '151', name: 'Wall Hung Vanities', slug: 'wall-hung-vanities', parent_id: '150', category_group: 'bathrooms' },
            { id: '152', name: 'Floor Standing Vanities', slug: 'floor-standing-vanities', parent_id: '150', category_group: 'bathrooms' },
            { id: '153', name: 'Space Saving Vanities', slug: 'space-saving-vanities', parent_id: '150', category_group: 'bathrooms' },
            { id: '154', name: 'Mirrored Shaving Cabinets', slug: 'mirrored-shaving-cabinets', parent_id: '150', category_group: 'bathrooms' },
            { id: '155', name: 'Tall Boys', slug: 'tall-boys', parent_id: '150', category_group: 'bathrooms' },
            { id: '156', name: 'Vanity Tops', slug: 'vanity-tops', parent_id: '150', category_group: 'bathrooms' },
            
            // BASINS
            {
                id: '160',
                name: 'Basins',
                slug: 'basins',
                description: 'Designer bathroom basins and sinks',
                parent_id: '100',
                category_group: 'bathrooms'
            },
            { id: '161', name: 'Above Counter Basins', slug: 'above-counter-basins', parent_id: '160', category_group: 'bathrooms' },
            { id: '162', name: 'Under Counter Basins', slug: 'under-counter-basins', parent_id: '160', category_group: 'bathrooms' },
            { id: '163', name: 'Wall Hung Basins', slug: 'wall-hung-basins', parent_id: '160', category_group: 'bathrooms' },
            { id: '164', name: 'Semi Recessed Basins', slug: 'semi-recessed-basins', parent_id: '160', category_group: 'bathrooms' },
            { id: '165', name: 'Freestanding Basins', slug: 'freestanding-basins', parent_id: '160', category_group: 'bathrooms' },
            
            // CABINET HANDLES
            {
                id: '170',
                name: 'Cabinet Handles',
                slug: 'cabinet-handles',
                description: 'Designer handles and hardware for bathroom cabinetry',
                parent_id: '100',
                category_group: 'bathrooms'
            },
            { id: '171', name: 'Knobs', slug: 'knobs', parent_id: '170', category_group: 'bathrooms' },
            { id: '172', name: 'Pull Handles', slug: 'pull-handles', parent_id: '170', category_group: 'bathrooms' },
            
            // TOILETS & BIDETS
            {
                id: '180',
                name: 'Toilets & Bidets',
                slug: 'toilets-bidets',
                description: 'Modern toilet suites and bidet systems',
                parent_id: '100',
                category_group: 'bathrooms'
            },
            { id: '181', name: 'Smart Toilets', slug: 'smart-toilets', parent_id: '180', category_group: 'bathrooms' },
            { id: '182', name: 'Toilet Suites', slug: 'toilet-suites', parent_id: '180', category_group: 'bathrooms' },
            { id: '183', name: 'Wall Faced Pans', slug: 'wall-faced-pans', parent_id: '180', category_group: 'bathrooms' },
            { id: '184', name: 'Wall Hung Pans', slug: 'wall-hung-pans', parent_id: '180', category_group: 'bathrooms' },
            { id: '185', name: 'Bidet', slug: 'bidet', parent_id: '180', category_group: 'bathrooms' },
            { id: '186', name: 'Inwall Cisterns', slug: 'inwall-cisterns', parent_id: '180', category_group: 'bathrooms' },
            { id: '187', name: 'Push Buttons', slug: 'push-buttons', parent_id: '180', category_group: 'bathrooms' },
            
            // BATHTUBS
            {
                id: '190',
                name: 'Bathtubs',
                slug: 'bathtubs',
                description: 'Luxury bathtubs and soaking tubs',
                parent_id: '100',
                category_group: 'bathrooms'
            },
            { id: '191', name: 'Drop in PVC Bath', slug: 'drop-in-pvc-bath', parent_id: '190', category_group: 'bathrooms' },
            { id: '192', name: 'Drop in Steel Baths', slug: 'drop-in-steel-baths', parent_id: '190', category_group: 'bathrooms' },
            { id: '193', name: 'Freestanding PVC Baths', slug: 'freestanding-pvc-baths', parent_id: '190', category_group: 'bathrooms' },
            { id: '194', name: 'Freestanding Stone Baths', slug: 'freestanding-stone-baths', parent_id: '190', category_group: 'bathrooms' },
            
            // MIRRORED SHAVING CABINETS
            {
                id: '200',
                name: 'Mirrored Shaving Cabinets',
                slug: 'mirrored-shaving-cabinets',
                description: 'Bathroom mirror cabinets with storage',
                parent_id: '100',
                category_group: 'bathrooms'
            },
            { id: '201', name: 'Rectangular Shaving Cabinet', slug: 'rectangular-shaving-cabinet', parent_id: '200', category_group: 'bathrooms' },
            { id: '202', name: 'Round Shaving Cabinet', slug: 'round-shaving-cabinet', parent_id: '200', category_group: 'bathrooms' },
            { id: '203', name: 'Single Arch Shaving Cabinet', slug: 'single-arch-shaving-cabinet', parent_id: '200', category_group: 'bathrooms' },
            { id: '204', name: 'Double Arch Shaving Cabinet', slug: 'double-arch-shaving-cabinet', parent_id: '200', category_group: 'bathrooms' },
            
            // CARE AND DISABILITY
            {
                id: '210',
                name: 'Care and Disability',
                slug: 'care-disability',
                description: 'Accessible bathroom solutions for care and disability',
                parent_id: '100',
                category_group: 'bathrooms'
            },
            { id: '211', name: 'Care Basins', slug: 'care-basins', parent_id: '210', category_group: 'bathrooms' },
            { id: '212', name: 'Care Tapware', slug: 'care-tapware', parent_id: '210', category_group: 'bathrooms' },
            { id: '213', name: 'Robust Tapware', slug: 'robust-tapware', parent_id: '210', category_group: 'bathrooms' },
            { id: '214', name: 'Care Toilets', slug: 'care-toilets', parent_id: '210', category_group: 'bathrooms' },
            { id: '215', name: 'Ambulant Toilet', slug: 'ambulant-toilet', parent_id: '210', category_group: 'bathrooms' },
            { id: '216', name: 'Pneumatics In-Wall Cisterns', slug: 'pneumatics-inwall-cisterns', parent_id: '210', category_group: 'bathrooms' },
            { id: '217', name: 'Care Compliant Rails', slug: 'care-compliant-rails', parent_id: '210', category_group: 'bathrooms' },
            { id: '218', name: 'Ambulant Grab Rails', slug: 'ambulant-grab-rails', parent_id: '210', category_group: 'bathrooms' },
            
            // BATHROOM PACKAGES
            {
                id: '220',
                name: 'Bathroom Packages',
                slug: 'bathroom-packages',
                description: 'Complete bathroom renovation packages',
                parent_id: '100',
                category_group: 'bathrooms'
            },
            { id: '221', name: 'Build your Bathroom', slug: 'build-your-bathroom', parent_id: '220', category_group: 'bathrooms' },
            
            // === GLASS FENCING ===
            {
                id: '300',
                name: 'Glass Fencing',
                slug: 'glass-fencing',
                description: 'Modern glass fencing systems for privacy and safety',
                parent_id: null,
                category_group: 'glass-solutions'
            },
            
            // FRAMELESS GLASS POOL FENCING
            {
                id: '310',
                name: 'Frameless Glass Pool Fencing',
                slug: 'frameless-glass-pool-fencing',
                description: 'Frameless glass pool safety fencing',
                parent_id: '300',
                category_group: 'glass-solutions'
            },
            { id: '311', name: 'Build Your Pool Fence', slug: 'build-pool-fence', parent_id: '310', category_group: 'glass-solutions' },
            { id: '312', name: '2205 Duplex Spigots', slug: '2205-duplex-spigots', parent_id: '310', category_group: 'glass-solutions' },
            { id: '313', name: 'Non Conductive Spigots', slug: 'non-conductive-spigots', parent_id: '310', category_group: 'glass-solutions' },
            { id: '314', name: 'Soft Close Hinges', slug: 'soft-close-hinges', parent_id: '310', category_group: 'glass-solutions' },
            { id: '315', name: 'Latch', slug: 'latch', parent_id: '310', category_group: 'glass-solutions' },
            { id: '316', name: 'Support Clamps', slug: 'support-clamps', parent_id: '310', category_group: 'glass-solutions' },
            { id: '317', name: 'Pool Fence Glass Panels', slug: 'pool-fence-glass-panels', parent_id: '310', category_group: 'glass-solutions' },
            { id: '318', name: 'Pool Fence Hinge Panels', slug: 'pool-fence-hinge-panels', parent_id: '310', category_group: 'glass-solutions' },
            { id: '319', name: 'Pool Fence Gates', slug: 'pool-fence-gates', parent_id: '310', category_group: 'glass-solutions' },
            { id: '320', name: 'Pool Fence Transition Panels', slug: 'pool-fence-transition-panels', parent_id: '310', category_group: 'glass-solutions' },
            { id: '321', name: 'Grout', slug: 'grout', parent_id: '310', category_group: 'glass-solutions' },
            { id: '322', name: 'Custom Glass', slug: 'custom-glass', parent_id: '310', category_group: 'glass-solutions' },
            
            // FRAMELESS GLASS BALUSTRADES
            {
                id: '330',
                name: 'Frameless Glass Balustrades',
                slug: 'frameless-glass-balustrades',
                description: 'Frameless glass balustrade systems',
                parent_id: '300',
                category_group: 'glass-solutions'
            },
            { id: '331', name: 'Build Your Balustrade', slug: 'build-balustrade', parent_id: '330', category_group: 'glass-solutions' },
            { id: '332', name: '2205 Duplex Spigots', slug: '2205-duplex-spigots-bal', parent_id: '330', category_group: 'glass-solutions' },
            { id: '333', name: 'Support and Glass Clamps', slug: 'support-glass-clamps', parent_id: '330', category_group: 'glass-solutions' },
            { id: '334', name: 'Mini Top Rail', slug: 'mini-top-rail', parent_id: '330', category_group: 'glass-solutions' },
            { id: '335', name: 'Mini Top Rail Connectors', slug: 'mini-top-rail-connectors', parent_id: '330', category_group: 'glass-solutions' },
            { id: '336', name: 'Deluxe Top Rail', slug: 'deluxe-top-rail', parent_id: '330', category_group: 'glass-solutions' },
            { id: '337', name: 'Standoffs', slug: 'standoffs', parent_id: '330', category_group: 'glass-solutions' },
            { id: '338', name: 'Tilt Lock Channel', slug: 'tilt-lock-channel', parent_id: '330', category_group: 'glass-solutions' },
            { id: '339', name: 'Deluxe Top Rail Connectors', slug: 'deluxe-top-rail-connectors', parent_id: '330', category_group: 'glass-solutions' },
            { id: '340', name: 'Balustrade Glass Panels', slug: 'balustrade-glass-panels', parent_id: '330', category_group: 'glass-solutions' },
            { id: '341', name: 'Grout', slug: 'grout-bal', parent_id: '330', category_group: 'glass-solutions' },
            { id: '342', name: 'Chemical Anchoring', slug: 'chemical-anchoring', parent_id: '330', category_group: 'glass-solutions' },
            { id: '343', name: 'Custom Glass', slug: 'custom-glass-bal', parent_id: '330', category_group: 'glass-solutions' },
            
            // FRAMELESS GLASS SHOWER SCREENS
            {
                id: '350',
                name: 'Frameless Glass Shower Screens',
                slug: 'frameless-glass-shower-screens',
                description: 'Frameless glass shower enclosures',
                parent_id: '300',
                category_group: 'glass-solutions'
            },
            { id: '351', name: 'Build Your Shower Screen', slug: 'build-shower-screen', parent_id: '350', category_group: 'glass-solutions' },
            { id: '352', name: 'Hinges', slug: 'hinges', parent_id: '350', category_group: 'glass-solutions' },
            { id: '353', name: 'Clamps', slug: 'clamps', parent_id: '350', category_group: 'glass-solutions' },
            { id: '354', name: 'Door Knobs', slug: 'door-knobs', parent_id: '350', category_group: 'glass-solutions' },
            { id: '355', name: 'Luxe Hardware Range', slug: 'luxe-hardware-range', parent_id: '350', category_group: 'glass-solutions' },
            { id: '356', name: 'Water Bar', slug: 'water-bar', parent_id: '350', category_group: 'glass-solutions' },
            { id: '357', name: 'PVC Water Seal', slug: 'pvc-water-seal', parent_id: '350', category_group: 'glass-solutions' },
            { id: '358', name: 'Shower Fixed Glass', slug: 'shower-fixed-glass', parent_id: '350', category_group: 'glass-solutions' },
            { id: '359', name: 'Shower Hinge Glass', slug: 'shower-hinge-glass', parent_id: '350', category_group: 'glass-solutions' },
            { id: '360', name: 'Shower Glass Doors', slug: 'shower-glass-doors', parent_id: '350', category_group: 'glass-solutions' },
            { id: '361', name: 'Shower Fixed with Radius Corner', slug: 'shower-fixed-radius-corner', parent_id: '350', category_group: 'glass-solutions' },
            { id: '362', name: 'Shower Fixed Low Iron Fluted with Radius Corners', slug: 'shower-fixed-low-iron-fluted-radius', parent_id: '350', category_group: 'glass-solutions' },
            { id: '363', name: 'Silicon', slug: 'silicon', parent_id: '350', category_group: 'glass-solutions' },
            { id: '364', name: 'Shower Handles', slug: 'shower-handles', parent_id: '350', category_group: 'glass-solutions' },
            { id: '365', name: 'Shower Knobs', slug: 'shower-knobs', parent_id: '350', category_group: 'glass-solutions' },
            
            // === ALUMINIUM FENCING ===
            {
                id: '400',
                name: 'Aluminium Fencing',
                slug: 'aluminium-solutions',
                description: 'Complete range of aluminium architectural products',
                parent_id: null,
                category_group: 'aluminium-solutions'
            },
            
            // ALUMINIUM POOL FENCING
            {
                id: '410',
                name: 'Aluminium Pool Fencing',
                slug: 'aluminium-pool-fencing',
                description: 'Australian-compliant aluminium pool safety fencing',
                parent_id: '400',
                category_group: 'aluminium-solutions'
            },
            { id: '411', name: 'Vista Aluminium Pool Fence', slug: 'vista-aluminium-pool-fence', parent_id: '410', category_group: 'aluminium-solutions' },
            { id: '412', name: 'Ray Aluminium Pool Fence', slug: 'ray-aluminium-pool-fence', parent_id: '410', category_group: 'aluminium-solutions' },
            { id: '413', name: 'Batten Aluminium Pool Fence', slug: 'batten-aluminium-pool-fence', parent_id: '410', category_group: 'aluminium-solutions' },
            { id: '414', name: 'Arc Aluminium Pool Fence', slug: 'arc-aluminium-pool-fence', parent_id: '410', category_group: 'aluminium-solutions' },
            { id: '415', name: 'Aluminium Pool Slat Fencing', slug: 'aluminium-pool-slat-fencing', parent_id: '410', category_group: 'aluminium-solutions' },
            { id: '416', name: 'Tubular Aluminium Fencing', slug: 'tubular-aluminium-fencing', parent_id: '410', category_group: 'aluminium-solutions' },
            { id: '417', name: 'Powder Coated Aluminium', slug: 'powder-coated-aluminium', parent_id: '410', category_group: 'aluminium-solutions' },
            { id: '418', name: 'Aluminium Pool Gates', slug: 'aluminium-pool-gates', parent_id: '410', category_group: 'aluminium-solutions' },
            
            // ALUMINIUM BALUSTRADES
            {
                id: '420',
                name: 'Aluminium Balustrades',
                slug: 'aluminium-balustrades',
                description: 'Modern aluminium balustrade systems',
                parent_id: '400',
                category_group: 'aluminium-solutions'
            },
            { id: '421', name: 'Blade Aluminium Balustrade', slug: 'blade-aluminium-balustrade', parent_id: '420', category_group: 'aluminium-solutions' },
            { id: '422', name: 'Ray Aluminium Balustrade', slug: 'ray-aluminium-balustrade', parent_id: '420', category_group: 'aluminium-solutions' },
            { id: '423', name: 'View Aluminium Balustrade', slug: 'view-aluminium-balustrade', parent_id: '420', category_group: 'aluminium-solutions' },
            { id: '424', name: 'Skye Aluminium Balustrade', slug: 'skye-aluminium-balustrade', parent_id: '420', category_group: 'aluminium-solutions' },
            
            // === FLOORING ===
            {
                id: '500',
                name: 'Flooring',
                slug: 'flooring',
                description: 'Premium flooring solutions for all applications',
                parent_id: null,
                category_group: 'flooring'
            },
            
            // TILES
            {
                id: '510',
                name: 'Tiles',
                slug: 'tiles',
                description: 'Luxury surface tiles for all applications',
                parent_id: '500',
                category_group: 'flooring'
            },
            { id: '511', name: 'Bathroom Tiles', slug: 'bathroom-tiles', parent_id: '510', category_group: 'flooring' },
            { id: '512', name: 'Kitchen / Laundry Tiles', slug: 'kitchen-laundry-tiles', parent_id: '510', category_group: 'flooring' },
            { id: '513', name: 'Splashback / Feature Tiles', slug: 'splashback-feature-tiles', parent_id: '510', category_group: 'flooring' },
            { id: '514', name: 'Living Tiles', slug: 'living-tiles', parent_id: '510', category_group: 'flooring' },
            { id: '515', name: 'Outdoor Tiles', slug: 'outdoor-tiles', parent_id: '510', category_group: 'flooring' },
            { id: '516', name: 'Pool Tiles', slug: 'pool-tiles', parent_id: '510', category_group: 'flooring' },
            // TILE MATERIAL TYPES
            { id: '517', name: 'Porcelain Tiles', slug: 'porcelain-tiles', parent_id: '510', category_group: 'flooring' },
            { id: '518', name: 'Ceramic Tiles', slug: 'ceramic-tiles', parent_id: '510', category_group: 'flooring' },
            { id: '519', name: 'Natural Stone Tiles', slug: 'natural-stone-tiles', parent_id: '510', category_group: 'flooring' },
            { id: '520', name: 'Mosaic Tiles', slug: 'mosaic-tiles', parent_id: '510', category_group: 'flooring' },
            { id: '521', name: 'Large Format Tiles', slug: 'large-format-tiles', parent_id: '510', category_group: 'flooring' },
            
            // COMPOSITE DECKING
            {
                id: '530',
                name: 'Composite Decking',
                slug: 'composite-decking',
                description: 'Premium outdoor decking solutions',
                parent_id: '500',
                category_group: 'flooring'
            },
            { id: '531', name: 'Milboard Decking', slug: 'milboard-decking', parent_id: '530', category_group: 'flooring' },
            { id: '532', name: 'Milboard Flexible Square Edging', slug: 'milboard-flexible-square-edging', parent_id: '530', category_group: 'flooring' },
            { id: '533', name: 'Milboard Bullnose Edging', slug: 'milboard-bullnose-edging', parent_id: '530', category_group: 'flooring' },
            { id: '534', name: 'Milboard Fascia Board', slug: 'milboard-fascia-board', parent_id: '530', category_group: 'flooring' },
            { id: '535', name: 'Milboard Weathered Decking', slug: 'milboard-weathered-decking', parent_id: '530', category_group: 'flooring' },
            { id: '536', name: 'Woodevo HomeAdvanced Decking', slug: 'woodevo-homeadvanced-decking', parent_id: '530', category_group: 'flooring' },
            
            // === COMPOSITE CLADDING ===
            {
                id: '600',
                name: 'Composite Cladding',
                slug: 'composite-cladding',
                description: 'Modern composite exterior cladding systems',
                parent_id: null,
                category_group: 'cladding'
            },
            { id: '601', name: 'Milboard Envello Shadowline', slug: 'milboard-envello-shadowline', parent_id: '600', category_group: 'cladding' },
            { id: '602', name: 'Milboard Envello Board & Batten', slug: 'milboard-envello-board-batten', parent_id: '600', category_group: 'cladding' },
            { id: '603', name: 'Woodevo Castellated Cladding', slug: 'woodevo-castellated-cladding', parent_id: '600', category_group: 'cladding' }
        ]
    });
});

module.exports = router;