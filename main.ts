"use strict";
import process from "node:process";

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error("\x1b[31mUsage:\x1b[0m csscalc <command> <value> [unit]");
  console.error("\x1b[31mCommands:\x1b[0m");
  console.error("  unit (u)   - Convert px to rem and vice versa");
  console.error("  color (c)  - Convert hex to HSL and HSL to hex");
  process.exit(1);
}

const [command, rawValue, ...restArgs] = args;
const normalizedCommand = command.toLowerCase();

const colors = {
  title: "\x1b[36m", // Cyan
  key: "\x1b[33m",   // Yellow
  value: "\x1b[32m", // Green
  reset: "\x1b[0m",  // Reset
};

if (["unit", "u"].includes(normalizedCommand)) {
  const unit = restArgs[0];
  const value = parseFloat(rawValue);

  if (isNaN(value)) {
    console.error("\x1b[31mError:\x1b[0m The second argument must be a number.");
    process.exit(1);
  }

  const base = { px: 16, rem: 1, em: 1 };

  function toRem(value: number, unit: string): number {
    if (unit in base) return value / base[unit];
    throw new Error(`Unsupported unit: ${unit}`);
  }

  function fromRem(value: number): Record<string, number> {
    return Object.fromEntries(Object.keys(base).map((key) => [key, value * base[key]]));
  }

  try {
    const remValue = toRem(value, unit);
    const conversions = fromRem(remValue);

    console.log(`${colors.title}Conversions for ${value}${unit}:${colors.reset}`);
    for (const [unit, convertedValue] of Object.entries(conversions)) {
      console.log(`${colors.key}${unit.padEnd(4)}:${colors.value} ${convertedValue.toFixed(2)}${unit}${colors.reset}`);
    }
  } catch (err: any) {
    console.error("\x1b[31mError:\x1b[0m", err.message);
    process.exit(1);
  }
}

else if (["color", "c"].includes(normalizedCommand)) {
  if (rawValue.startsWith("#")) {
    // HEX → HSL
    const hex = rawValue.replace(/^#/, ""); // Remove `#` if present

    if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
      console.error("\x1b[31mError:\x1b[0m Invalid HEX color format. Use #RRGGBB.");
      process.exit(1);
    }

    function hexToRgb(hex: string): [number, number, number] {
      return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16),
      ];
    }

    function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
      r /= 255;
      g /= 255;
      b /= 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      let h = 0, s, l = (max + min) / 2;

      if (max === min) {
        s = 0; // No saturation
      } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h *= 60;
      }
      return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
    }

    try {
      const [r, g, b] = hexToRgb(hex);
      const [h, s, l] = rgbToHsl(r, g, b);

      console.log(`${colors.title}HEX to HSL conversion:${colors.reset}`);
      console.log(`${colors.key}HEX:${colors.value} #${hex}${colors.reset}`);
      console.log(`${colors.key}HSL:${colors.value} ${h} ${s}% ${l}%${colors.reset}`);
    } catch (err: any) {
      console.error("\x1b[31mError:\x1b[0m", err.message);
      process.exit(1);
    }
  } else {
    // HSL → HEX
    if (restArgs.length < 2) {
      console.error("\x1b[31mError:\x1b[0m HSL format must be 'H S% L%'");
      process.exit(1);
    }

    const h = parseFloat(rawValue);
    const s = parseFloat(restArgs[0].replace("%", "")) / 100;
    const l = parseFloat(restArgs[1].replace("%", "")) / 100;

    if (isNaN(h) || isNaN(s) || isNaN(l) || h < 0 || h > 360 || s < 0 || s > 1 || l < 0 || l > 1) {
      console.error("\x1b[31mError:\x1b[0m Invalid HSL values.");
      process.exit(1);
    }

    function hslToRgb(h: number, s: number, l: number): [number, number, number] {
      const hueToRgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;

      return [
        Math.round(hueToRgb(p, q, h / 360 + 1 / 3) * 255),
        Math.round(hueToRgb(p, q, h / 360) * 255),
        Math.round(hueToRgb(p, q, h / 360 - 1 / 3) * 255),
      ];
    }

    function rgbToHex(r: number, g: number, b: number): string {
      return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
    }

    try {
      const [r, g, b] = hslToRgb(h, s, l);
      const hex = rgbToHex(r, g, b);

      console.log(`${colors.title}HSL to HEX conversion:${colors.reset}`);
      console.log(`${colors.key}HSL:${colors.value} ${h} ${s * 100}% ${l * 100}%${colors.reset}`);
      console.log(`${colors.key}HEX:${colors.value} ${hex}${colors.reset}`);
    } catch (err: any) {
      console.error("\x1b[31mError:\x1b[0m", err.message);
      process.exit(1);
    }
  }
}

else {
  console.error("\x1b[31mError:\x1b[0m Unknown command. Use 'unit' (u) or 'color' (c).");
  process.exit(1);
}
