import { Platform } from "react-native";

export const USE_NATIVE_DRIVER = Platform.OS !== "web";
export const WEB_POINTER_EVENTS_NONE_STYLE =
  Platform.OS === "web" ? { pointerEvents: "none" } : null;

function clampOpacity(value) {
  return Math.max(0, Math.min(1, Number(value ?? 1)));
}

function parseHexColor(color) {
  const match = /^#([a-f\d]{3,8})$/i.exec(String(color || "").trim());
  if (!match) return null;

  const hex = match[1];
  if (hex.length === 3 || hex.length === 4) {
    const [r, g, b, a = "f"] = hex.split("");
    return {
      red: Number.parseInt(`${r}${r}`, 16),
      green: Number.parseInt(`${g}${g}`, 16),
      blue: Number.parseInt(`${b}${b}`, 16),
      alpha: Number.parseInt(`${a}${a}`, 16) / 255,
    };
  }

  if (hex.length === 6 || hex.length === 8) {
    return {
      red: Number.parseInt(hex.slice(0, 2), 16),
      green: Number.parseInt(hex.slice(2, 4), 16),
      blue: Number.parseInt(hex.slice(4, 6), 16),
      alpha: hex.length === 8 ? Number.parseInt(hex.slice(6, 8), 16) / 255 : 1,
    };
  }

  return null;
}

function parseRgbColor(color) {
  const match =
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i.exec(
      String(color || "").trim()
    );
  if (!match) return null;

  return {
    red: Number.parseFloat(match[1]),
    green: Number.parseFloat(match[2]),
    blue: Number.parseFloat(match[3]),
    alpha: match[4] == null ? 1 : Number.parseFloat(match[4]),
  };
}

function colorWithOpacity(color, opacity) {
  if (color === "transparent") return "rgba(0, 0, 0, 0)";

  const parsed = parseHexColor(color) || parseRgbColor(color);
  if (!parsed) return color;

  const alpha = clampOpacity(parsed.alpha * clampOpacity(opacity));
  return `rgba(${parsed.red}, ${parsed.green}, ${parsed.blue}, ${alpha})`;
}

export function createShadowStyle({
  color = "#000000",
  opacity = 0.2,
  radius = 8,
  offsetX = 0,
  offsetY = 4,
  elevation = 0,
}) {
  if (Platform.OS === "web") {
    return {
      boxShadow: `${offsetX}px ${offsetY}px ${radius}px ${colorWithOpacity(color, opacity)}`,
    };
  }

  const style = {
    shadowColor: color,
    shadowOpacity: opacity,
    shadowRadius: radius,
    shadowOffset: { width: offsetX, height: offsetY },
  };
  if (elevation > 0) style.elevation = elevation;
  return style;
}

export function createTextShadowStyle({
  color = "rgba(0,0,0,0.45)",
  offsetX = 0,
  offsetY = 1,
  radius = 4,
}) {
  if (Platform.OS === "web") {
    return {
      textShadow: `${offsetX}px ${offsetY}px ${radius}px ${color}`,
    };
  }

  return {
    textShadowColor: color,
    textShadowOffset: { width: offsetX, height: offsetY },
    textShadowRadius: radius,
  };
}
