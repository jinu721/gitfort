import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
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