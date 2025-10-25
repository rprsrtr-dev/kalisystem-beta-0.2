import { Item, Unit, UNITS } from '@/types';

export interface ParsedItem {
  name: string;
  variant?: string;
  quantity: number;
  unit?: Unit;
  matchedItem?: Item;
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '')
    .trim();
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

export function findBestMatch(searchText: string, items: Item[]): Item | null {
  const normalized = normalizeText(searchText);
  let bestMatch: Item | null = null;
  let bestScore = Infinity;

  for (const item of items) {
    const itemName = normalizeText(item.name);
    const itemVariant = item.variant ? normalizeText(item.variant) : '';
    const fullName = itemVariant ? `${itemName}${itemVariant}` : itemName;

    const distance = Math.min(
      levenshteinDistance(normalized, itemName),
      levenshteinDistance(normalized, fullName)
    );

    const maxLength = Math.max(normalized.length, fullName.length);
    const similarityRatio = 1 - distance / maxLength;

    if (similarityRatio > 0.6 && distance < bestScore) {
      bestScore = distance;
      bestMatch = item;
    }
  }

  return bestMatch;
}

function parseUnit(text: string): Unit | undefined {
  const normalized = text.toLowerCase().trim();

  const unitMapping: Record<string, Unit> = {
    'pieces': 'pc',
    'piece': 'pc',
    'pcs': 'pc',
    'pc': 'pc',
    'liters': 'L',
    'liter': 'L',
    'l': 'L',
    'packet': 'pk',
    'packets': 'pk',
    'pax': 'pk',
    'pk': 'pk',
    'kg': 'kg',
    'kilogram': 'kg',
    'kilograms': 'kg',
    'roll': 'roll',
    'rolls': 'roll',
    'block': 'block',
    'blocks': 'block',
    '5l': '5L',
    'case': 'case',
    'cases': 'case',
    'box': 'box',
    'boxes': 'box',
    'ctn': 'ctn',
    'carton': 'ctn',
    'cartons': 'ctn',
    'bt': 'bt',
    'bottle': 'bt',
    'bottles': 'bt',
    '1lbt': '1Lbt',
    'jar': 'jar',
    'jars': 'jar',
    'glass': 'glass',
    'glasses': 'glass',
    'small': 'small',
    'big': 'big',
    'pc_cut': 'pc_cut',
  };

  return unitMapping[normalized];
}

export function parseItemLine(line: string, items: Item[]): ParsedItem | null {
  if (!line.trim()) return null;

  const quantityRegex = /^([0-9]+(?:\.[0-9]+)?)\s*([a-zA-Z]*)\s+(.+)$/;
  const match = line.match(quantityRegex);

  if (!match) {
    const itemMatch = findBestMatch(line, items);
    return {
      name: line.trim(),
      quantity: 1,
      matchedItem: itemMatch || undefined,
    };
  }

  const quantity = parseFloat(match[1]);
  const unitText = match[2];
  const itemText = match[3];

  const unit = unitText ? parseUnit(unitText) : undefined;
  const matchedItem = findBestMatch(itemText, items);

  return {
    name: matchedItem?.name || itemText.trim(),
    variant: matchedItem?.variant || undefined,
    quantity,
    unit: unit || matchedItem?.unit || undefined,
    matchedItem: matchedItem || undefined,
  };
}

export function parseItemList(text: string, items: Item[]): ParsedItem[] {
  const lines = text.split('\n').filter((line) => line.trim());
  const parsed: ParsedItem[] = [];

  for (const line of lines) {
    const item = parseItemLine(line, items);
    if (item) {
      parsed.push(item);
    }
  }

  return parsed;
}
