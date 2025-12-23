/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: '#f5c84c',
        'accent-strong': '#ff6b35',
        danger: '#ff4d6d',
        success: '#5be7a9',
        'text-muted': '#9fa5cf',
        'panel-bg': 'rgba(16, 18, 32, 0.85)',
        'panel-border': 'rgba(255, 255, 255, 0.08)',
        'outline': 'rgba(245, 200, 76, 0.35)',
      },
      fontFamily: {
        sans: ['Space Grotesk', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(circle at top, #141622, #08080f 55%)',
      },
    },
  },
  plugins: [require("flyonui")],
  flyonui: {
    themes: [
      {
        dark: {
          "primary": "#f5c84c",
          "primary-focus": "#ff6b35", 
          "primary-content": "#120b0a",
          "secondary": "#9fa5cf",
          "secondary-focus": "#7d84a3",
          "secondary-content": "#f4f6ff",
          "accent": "#ff6b35",
          "accent-focus": "#ff8555",
          "accent-content": "#120b0a",
          "neutral": "#141622",
          "neutral-focus": "#0f1119",
          "neutral-content": "#f4f6ff",
          "base-100": "#101820",
          "base-200": "#161d29",
          "base-300": "#1c2331",
          "base-content": "#f4f6ff",
          "info": "#3abff8",
          "success": "#5be7a9",
          "warning": "#f5c84c",
          "error": "#ff4d6d",
        },
      },
    ],
    darkTheme: "dark",
    base: true,
    styled: true,
    utils: true,
    prefix: "",
    logs: true,
    themeRoot: ":root",
  },
}
