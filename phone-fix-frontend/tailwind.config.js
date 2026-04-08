/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    dark: '#0f5156', // Deep Teal (Text/Sidebar active text)
                    primary: '#14b8a6', //  Teal 500 (Primary Actions)
                    secondary: '#5eead4', // Teal 300 (Accents)
                    light: '#ccfbf1', // Teal 100 (Backgrounds)
                    surface: '#ffffff', // White
                    gray: '#f0fdfa', // Teal-tinted gray
                }
            }
        },
    },
    plugins: [],
}
