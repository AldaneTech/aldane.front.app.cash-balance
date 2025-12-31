module.exports = {
  content: [
    "./src/**/*.{html,ts}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1e40af',      // brand -> text-brand, bg-brand, border-brand
          light: '#60a5fa',        // brand-light
          dark: '#1e3a8a',         // brand-dark
          main: '#2E7D32', 
          secondary: '#27642A',
          lightmain: '#2ecc71',
          background: '#DBCECC', // brand-background
        },
        success: '#22c55e',
        warning: '#facc15',
        danger: '#ef4444',
      }
    },
  },
  plugins: [],
}
