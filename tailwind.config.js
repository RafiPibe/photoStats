/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                cream: {
                    50: '#fbf8f4',
                    100: '#f6f1ea',
                    200: '#eee3d7',
                    300: '#e7ded3',
                    400: '#d5c8b8',
                    500: '#a89b8d',
                    600: '#8b7f72',
                    700: '#7d6f5f',
                    800: '#6f6458',
                    900: '#4b463e',
                },
                dark: {
                    DEFAULT: '#1b1712',
                    100: '#2b251d',
                    200: '#191611',
                },
            },
            fontFamily: {
                sans: ['"Plus Jakarta Sans"', 'sans-serif'],
                display: ['"Space Grotesk"', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
