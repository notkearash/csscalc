"usr strict";
import process from "node:process"

const args = process.argv.slice(2);
if (args.length !== 2) {
  console.error("\x1b[31mUsage:\x1b[0m csscalc <number> <unit>");
  process.exit(1);
}

const [rawValue, unit] = args;
const value = parseFloat(rawValue);

if (isNaN(value)) {
  console.error("\x1b[31mError:\x1b[0m The first argument must be a number.");
  process.exit(1);
}

// Conversion ratios for a base value of 1 rem (16px)
const base = {
  px: 16,    // 1 rem = 16 px
  rem: 1,    // 1 rem = 1 rem
  em: 1,     // 1 rem = 1 em
};

// Convert to rem as the base unit
function toRem(value: number, unit: string): number {
  if (unit in base) {
    return value / base[unit];
  }
  throw new Error(`Unsupported unit: ${unit}`);
}

// Convert from rem to all other units
function fromRem(value: number): Record<string, number> {
  return Object.fromEntries(
    Object.keys(base).map((key) => [key, value * base[key]])
  );
}

// Colors for the output
const colors = {
  title: "\x1b[36m", // Cyan
  key: "\x1b[33m",   // Yellow
  value: "\x1b[32m", // Green
  reset: "\x1b[0m",  // Reset
};

try {
  const remValue = toRem(value, unit);
  const conversions = fromRem(remValue);

  console.log(
    `${colors.title}Conversions for ${value}${unit}:${colors.reset}`
  );
  for (const [unit, convertedValue] of Object.entries(conversions)) {
    console.log(
      `${colors.key}${unit.padEnd(4)}:${colors.value} ${convertedValue.toFixed(
        2
      )}${unit}${colors.reset}`
    );
  }
} catch (err: any) {
  console.error("\x1b[31mError:\x1b[0m", err.message);
  process.exit(1);
}

