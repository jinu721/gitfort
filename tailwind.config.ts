import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
        'fjalla-one': ['var(--font-fjalla-one)', 'sans-serif'],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // GitHub-inspired color palette
        github: {
          bg: "#0d1117",
          surface: "#161b22",
          border: "#30363d",
          text: "#f0f6fc",
          muted: "#8b949e",
          accent: "#238636",
          danger: "#da3633",
          warning: "#d29922",
          info: "#1f6feb",
        },
        // Dashboard-specific colors
        dashboard: {
          primary: "#2563eb",
          secondary: "#64748b",
          success: "#059669",
          warning: "#d97706",
          error: "#dc2626",
          surface: "#f8fafc",
          "surface-dark": "#1e293b",
        },
      },
      // Custom animations for loading states
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "bounce-slow": "bounce 2s infinite",
        "gradient-x": "gradient-x 3s ease infinite",
        "float": "float 6s ease-in-out infinite",
        "glow": "glow 2s ease-in-out infinite",
        "shimmer": "shimmer 2s infinite",
      },
      keyframes: {
        "gradient-x": {
          "0%, 100%": {
            "background-size": "200% 200%",
            "background-position": "left center"
          },
          "50%": {
            "background-size": "200% 200%",
            "background-position": "right center"
          }
        },
        "float": {
          "0%, 100%": {
            transform: "translateY(0px)"
          },
          "50%": {
            transform: "translateY(-20px)"
          }
        },
        "glow": {
          "0%, 100%": {
            opacity: "0.5"
          },
          "50%": {
            opacity: "1"
          }
        },
        "shimmer": {
          "0%": {
            "background-position": "-200% 0"
          },
          "100%": {
            "background-position": "200% 0"
          }
        }
      },
      // Custom spacing for dashboard layouts
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
        "128": "32rem",
      },
    },
  },
  plugins: [],
};
export default config;