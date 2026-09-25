import React, { forwardRef, useSyncExternalStore } from "react";
import { Alert as NativeAlert, Pressable as NativePressable, Text as NativeText, TextInput as NativeTextInput } from "react-native";
import { getStoredLanguage, saveStoredLanguage } from "../services/languageStorage";
import sourceCatalog from "./locales/source.json";
import pl from "./locales/pl.json";
import en from "./locales/en.json";
import de from "./locales/de.json";
import es from "./locales/es.json";

export const SUPPORTED_LANGUAGES = Object.freeze([
  { id: "pl", label: "Polski", shortLabel: "PL", locale: "pl-PL" },
  { id: "en", label: "English", shortLabel: "EN", locale: "en-US" },
  { id: "de", label: "Deutsch", shortLabel: "DE", locale: "de-DE" },
  { id: "es", label: "Español", shortLabel: "ES", locale: "es-ES" },
]);

const resources = { pl, en, de, es };
const localeByLanguage = Object.fromEntries(SUPPORTED_LANGUAGES.map((entry) => [entry.id, entry.locale]));
const listeners = new Set();
const exactKeys = new Map(Object.entries(sourceCatalog).map(([key, source]) => [canonical(source), key]));
const exactKeysLower = new Map();
for (const [key, source] of Object.entries(sourceCatalog)) {
  const lower = canonical(source).toLocaleLowerCase("pl-PL");
  if (lower.length >= 4 && !exactKeysLower.has(lower)) exactKeysLower.set(lower, key);
}
const translationCache = new Map();

function canonical(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const patterns = Object.entries(sourceCatalog)
  .filter(([, source]) => /\{\d+\}/.test(source) && source.replace(/\{\d+\}/g, "").replace(/\s+/g, "").length >= 4)
  .map(([key, source]) => {
    const placeholderOrder = [];
    const parts = source.split(/(\{\d+\})/g).filter(Boolean);
    const regexSource = parts.map((part) => {
      const match = /^\{(\d+)\}$/.exec(part);
      if (!match) return escapeRegExp(canonical(part));
      placeholderOrder.push(Number(match[1]));
      return "(.*?)";
    }).join("\\s*");
    return { key, placeholderOrder, regex: new RegExp(`^${regexSource}$`, "u"), sourceLength: source.length };
  })
  .sort((left, right) => right.sourceLength - left.sourceLength);

function detectDeviceLanguage() {
  const candidates = [];
  if (typeof navigator !== "undefined") candidates.push(...(navigator.languages || []), navigator.language);
  try {
    candidates.push(Intl.DateTimeFormat().resolvedOptions().locale);
  } catch (_error) {}
  for (const candidate of candidates) {
    const language = String(candidate || "").toLowerCase().split(/[-_]/)[0];
    if (resources[language]) return language;
  }
  return "pl";
}

let currentLanguage = detectDeviceLanguage();
let initializationPromise = null;

export function getLanguage() {
  return currentLanguage;
}

export function getIntlLocale(language = currentLanguage) {
  return localeByLanguage[language] || localeByLanguage.pl;
}

export function setLanguage(language, { persist = true } = {}) {
  const next = resources[language] ? language : "pl";
  if (next === currentLanguage) return next;
  currentLanguage = next;
  translationCache.clear();
  listeners.forEach((listener) => listener());
  if (persist) void saveStoredLanguage(next);
  return next;
}

export function initializeLanguage() {
  if (!initializationPromise) {
    initializationPromise = getStoredLanguage().then((stored) => {
      if (stored && resources[stored]) setLanguage(stored, { persist: false });
      return currentLanguage;
    });
  }
  return initializationPromise;
}

export function subscribeLanguage(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useLanguage() {
  const language = useSyncExternalStore(subscribeLanguage, getLanguage, getLanguage);
  return { language, locale: getIntlLocale(language), setLanguage };
}

function interpolate(template, values) {
  return String(template).replace(/\{(\d+)\}/g, (_match, index) => values?.[Number(index)] ?? "");
}

export function translateKey(key, values = [], language = currentLanguage) {
  const template = resources[language]?.[key] || pl[key] || sourceCatalog[key] || key;
  return interpolate(template, values);
}

export function translateText(value, language = currentLanguage, depth = 0) {
  if (typeof value !== "string" || !value.trim()) return value;
  const normalized = canonical(value);
  const cacheKey = `${language}\u0000${normalized}`;
  if (translationCache.has(cacheKey)) return translationCache.get(cacheKey);

  const exactKey = exactKeys.get(normalized);
  if (exactKey) {
    const result = translateKey(exactKey, [], language);
    translationCache.set(cacheKey, result);
    return result;
  }
  const caseInsensitiveKey = exactKeysLower.get(normalized.toLocaleLowerCase("pl-PL"));
  if (caseInsensitiveKey) {
    const result = translateKey(caseInsensitiveKey, [], language);
    translationCache.set(cacheKey, result);
    return result;
  }

  const decoration = /^(.*?)(\s*[›▾]+)$/u.exec(normalized);
  if (decoration) {
    const core = translateText(decoration[1], language, depth + 1);
    if (core !== decoration[1]) {
      const result = `${core}${decoration[2]}`;
      translationCache.set(cacheKey, result);
      return result;
    }
  }

  if (depth < 4) {
    const effectSuffix = /^(.*[.!?])\s+((?:Zarobiłeś|Strata|Koszt|HP|Heat|Szacun)\b.*)$/u.exec(normalized);
    if (effectSuffix) {
      const message = translateText(effectSuffix[1], language, depth + 1);
      const effects = translateText(effectSuffix[2], language, depth + 1);
      if (message !== effectSuffix[1] || effects !== effectSuffix[2]) {
        const result = `${message} ${effects}`;
        translationCache.set(cacheKey, result);
        return result;
      }
    }
  }

  if (depth < 4 && normalized.includes(" · ")) {
    const parts = normalized.split(" · ");
    const localizedParts = parts.map((part) => translateText(part, language, depth + 1));
    if (localizedParts.some((part, index) => part !== parts[index])) {
      const result = localizedParts.join(" · ");
      translationCache.set(cacheKey, result);
      return result;
    }
  }

  for (const pattern of patterns) {
    const match = pattern.regex.exec(normalized);
    if (!match) continue;
    const values = [];
    pattern.placeholderOrder.forEach((placeholder, index) => {
      const captured = match[index + 1];
      values[placeholder] = depth < 4 ? translateText(captured, language, depth + 1) : captured;
    });
    const result = translateKey(pattern.key, values, language);
    translationCache.set(cacheKey, result);
    return result;
  }

  if (depth < 4) {
    const amountSuffix = /^(.{2,40})\s+([$€£]\s*[\d.,\s]+|[\d.,\s]+\s*[$€£])$/u.exec(normalized);
    if (amountSuffix) {
      const action = translateText(amountSuffix[1], language, depth + 1);
      if (action !== amountSuffix[1]) {
        const result = `${action} ${amountSuffix[2]}`;
        translationCache.set(cacheKey, result);
        return result;
      }
    }
    const colon = /^(.{2,48}:)\s+(.+)$/u.exec(normalized);
    if (colon) {
      const label = colon[1].slice(0, -1);
      const translatedLabel = translateText(label, language, depth + 1);
      const left = translatedLabel !== label ? `${translatedLabel}:` : colon[1];
      const right = translateText(colon[2], language, depth + 1);
      if (left !== colon[1] || right !== colon[2]) {
        const result = `${left} ${right}`;
        translationCache.set(cacheKey, result);
        return result;
      }
    }
  }

  translationCache.set(cacheKey, value);
  return value;
}

function localizeChildren(children, language) {
  if (typeof children === "string") return translateText(children, language);
  if (!Array.isArray(children)) return children;
  if (children.every((child) => child === null || child === undefined || typeof child === "string" || typeof child === "number")) {
    const compactChildren = children.filter((child) => child !== null && child !== undefined);
    const localizedChildren = compactChildren.map((child) => typeof child === "string" ? translateText(child, language) : child);
    if (localizedChildren.some((child, index) => child !== compactChildren[index])) return localizedChildren;
    const joined = compactChildren.join("");
    const localized = translateText(joined, language);
    if (localized !== joined) return localized;
    return compactChildren;
  }
  return children.map((child, index) => typeof child === "string" ? translateText(child, language) : React.isValidElement(child) ? React.cloneElement(child, { key: child.key ?? `i18n-${index}` }) : child);
}

export const Text = forwardRef(function LocalizedText({ children, translate = true, ...props }, ref) {
  const { language } = useLanguage();
  return <NativeText ref={ref} {...props}>{translate ? localizeChildren(children, language) : children}</NativeText>;
});

export const TextInput = forwardRef(function LocalizedTextInput({ placeholder, ...props }, ref) {
  const { language } = useLanguage();
  const accessibilityLabel = translateText(props.accessibilityLabel, language);
  const accessibilityHint = translateText(props.accessibilityHint, language);
  return <NativeTextInput ref={ref} placeholder={translateText(placeholder, language)} {...props} accessibilityLabel={accessibilityLabel} accessibilityHint={accessibilityHint} />;
});

export const Pressable = forwardRef(function LocalizedPressable({ accessibilityLabel, accessibilityHint, ...props }, ref) {
  const { language } = useLanguage();
  return <NativePressable ref={ref} {...props} accessibilityLabel={translateText(accessibilityLabel, language)} accessibilityHint={translateText(accessibilityHint, language)} />;
});

export const Alert = {
  ...NativeAlert,
  alert(title, message, buttons, options) {
    const localizedButtons = buttons?.map((button) => ({ ...button, text: translateText(button.text) }));
    return NativeAlert.alert(translateText(title), translateText(message), localizedButtons, options);
  },
};

export function formatNumber(value, options, language = currentLanguage) {
  return new Intl.NumberFormat(getIntlLocale(language), options).format(Number(value) || 0);
}

export function formatDate(value, options = { dateStyle: "medium" }, language = currentLanguage) {
  return new Intl.DateTimeFormat(getIntlLocale(language), options).format(new Date(value));
}

export function formatTime(value, options = { hour: "2-digit", minute: "2-digit" }, language = currentLanguage) {
  return new Intl.DateTimeFormat(getIntlLocale(language), options).format(new Date(value));
}

export function formatPlural(count, forms, language = currentLanguage) {
  const category = new Intl.PluralRules(getIntlLocale(language)).select(Number(count) || 0);
  const template = forms?.[category] || forms?.other || "{0}";
  return interpolate(template, [formatNumber(count, undefined, language)]);
}

void initializeLanguage();
