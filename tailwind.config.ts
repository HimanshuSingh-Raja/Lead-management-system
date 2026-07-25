import type { Config } from "tailwindcss";
const config: Config = { content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"], theme: { extend: { colors: { ink: "#0b1020", brand: { 400: "#8b7cff", 500: "#6d5dfc", 600: "#5848e8" } }, boxShadow: { glow: "0 20px 80px rgba(109,93,252,.22)" } } }, plugins: [] };
export default config;
