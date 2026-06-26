/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // React dosyalarını taraması için bu satır kritik!
  ],
  theme: {
    extend: {
      colors: {
        'brand-blue': '#2563eb',
        'brand-orange': '#f97316',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}