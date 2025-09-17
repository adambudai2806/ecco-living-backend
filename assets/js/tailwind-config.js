tailwind.config = {
    theme: {
        extend: {
            colors: {
                primary: '#1a1a1a',       // Rich black from logo
                secondary: '#f8f9fa',     // Clean light background
                accent: '#c0c0c0',        // Silver/platinum from "LIVING"
                'accent-dark': '#a0a0a0', // Darker silver
                'accent-light': '#e5e5e5', // Light silver
                'text-light': '#6b7280',  // Modern gray
                'text-dark': '#1f2937',   // Dark gray
                'ecco-black': '#000000',  // Pure black from "ecco"
                'ecco-silver': '#c0c0c0', // Silver from "LIVING"
            },
            fontFamily: {
                'sans': ['Inter', 'system-ui', 'sans-serif'],
                'display': ['Playfair Display', 'serif'],
            },
            animation: {
                'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
                'fade-in-left': 'fadeInLeft 0.8s ease-out forwards',
                'fade-in-right': 'fadeInRight 0.8s ease-out forwards',
                'scale-in': 'scaleIn 0.6s ease-out forwards',
                'slide-up': 'slideUp 0.6s ease-out forwards',
                'float': 'float 6s ease-in-out infinite',
                'glow': 'glow 2s ease-in-out infinite alternate',
                'text-reveal': 'textReveal 1.2s ease-out forwards',
                'image-reveal': 'imageReveal 1.4s ease-out forwards',
            }
        }
    }
}