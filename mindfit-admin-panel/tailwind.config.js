/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    // Use class strategy to avoid interfering with Angular Material inputs
    require('@tailwindcss/forms')({ strategy: 'class' }),
  ],
}
