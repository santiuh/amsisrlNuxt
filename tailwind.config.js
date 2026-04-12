import defaultTheme from 'tailwindcss/defaultTheme'

export default {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'fcfcfc': '#fcfcfc',
        '12161e': '#12161e',
        '656976': '#656976',
        'c2c3c7': '#c2c3c7',
        '91949b': '#91949b',
        '232730': '#232730',
        '575a64': '#575a64',
      },
      padding: {
        '2.25': '0.563rem',
      },
      maxWidth: {
        '75': '18.75rem',
      },
      fontFamily: {
        sans: ['SuisseIntl', ...defaultTheme.fontFamily.sans]
      },
      boxShadow: {
        'soft': '0 1px 2px rgba(0,0,0,0.03), 0 1px 3px rgba(0,0,0,0.02)',
        'card': '0 1px 3px rgba(0,0,0,0.03), 0 4px 14px rgba(0,0,0,0.04)',
        'card-hover': '0 2px 6px rgba(0,0,0,0.05), 0 8px 24px rgba(0,0,0,0.06)',
        'elevated': '0 8px 30px rgba(0,0,0,0.07), 0 2px 8px rgba(0,0,0,0.03)',
        'header': '0 1px 3px rgba(0,0,0,0.04), 0 1px 0 rgba(0,0,0,0.02)',
        'sidebar': '1px 0 3px rgba(0,0,0,0.08)',
      },
    }
  }
}
