/**
 * Array utilities for SynkBoard
 * Pure array manipulation functions
 */

/**
 * Remove duplicates from array
 */
export function unique<T>(array: T[]): T[] {
  return [...new Set(array)];
}

/**
 * Remove duplicates from array of objects by key
 */
export function uniqueBy<T>(array: T[], key: keyof T): T[] {
  const seen = new Set();
  return array.filter(item => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}

/**
 * Group array of objects by key
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const value = String(item[key]);
    if (!groups[value]) {
      groups[value] = [];
    }
    groups[value].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

/**
 * Sort array of objects by key
 */
export function sortBy<T>(array: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

/**
 * Chunk array into smaller arrays
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Flatten nested arrays
 */
export function flatten<T>(array: (T | T[])[]): T[] {
  return array.reduce<T[]>((flat, item) => {
    return flat.concat(Array.isArray(item) ? flatten(item) : item);
  }, []);
}

/**
 * Get intersection of two arrays
 */
export function intersection<T>(array1: T[], array2: T[]): T[] {
  return array1.filter(item => array2.includes(item));
}

/**
 * Get difference between two arrays
 */
export function difference<T>(array1: T[], array2: T[]): T[] {
  return array1.filter(item => !array2.includes(item));
}

/**
 * Get union of two arrays (unique items from both)
 */
export function union<T>(array1: T[], array2: T[]): T[] {
  return unique([...array1, ...array2]);
}

/**
 * Shuffle array randomly
 */
export function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get random item from array
 */
export function sample<T>(array: T[]): T | undefined {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Get multiple random items from array
 */
export function sampleSize<T>(array: T[], size: number): T[] {
  const shuffled = shuffle(array);
  return shuffled.slice(0, Math.min(size, array.length));
}

/**
 * Check if array is empty
 */
export function isArrayEmpty<T>(array: T[]): boolean {
  return array.length === 0;
}

/**
 * Get first item from array
 */
export function first<T>(array: T[]): T | undefined {
  return array[0];
}

/**
 * Get last item from array
 */
export function last<T>(array: T[]): T | undefined {
  return array[array.length - 1];
}

/**
 * Get nth item from array
 */
export function nth<T>(array: T[], index: number): T | undefined {
  return index >= 0 ? array[index] : array[array.length + index];
}

/**
 * Remove item from array by value
 */
export function remove<T>(array: T[], value: T): T[] {
  return array.filter(item => item !== value);
}

/**
 * Remove item from array by index
 */
export function removeAt<T>(array: T[], index: number): T[] {
  return array.filter((_, i) => i !== index);
}

/**
 * Insert item at specific index
 */
export function insertAt<T>(array: T[], index: number, item: T): T[] {
  const result = [...array];
  result.splice(index, 0, item);
  return result;
}

/**
 * Move item from one index to another
 */
export function move<T>(array: T[], fromIndex: number, toIndex: number): T[] {
  const result = [...array];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
}

/**
 * Find item in array by predicate
 */
export function findBy<T>(array: T[], predicate: (item: T) => boolean): T | undefined {
  return array.find(predicate);
}

/**
 * Find index of item in array by predicate
 */
export function findIndexBy<T>(array: T[], predicate: (item: T) => boolean): number {
  return array.findIndex(predicate);
}

/**
 * Check if array includes item by predicate
 */
export function includesBy<T>(array: T[], predicate: (item: T) => boolean): boolean {
  return array.some(predicate);
}

/**
 * Count items in array by predicate
 */
export function countBy<T>(array: T[], predicate: (item: T) => boolean): number {
  return array.filter(predicate).length;
}

/**
 * Partition array into two arrays based on predicate
 */
export function partition<T>(array: T[], predicate: (item: T) => boolean): [T[], T[]] {
  const truthy: T[] = [];
  const falsy: T[] = [];
  
  array.forEach(item => {
    if (predicate(item)) {
      truthy.push(item);
    } else {
      falsy.push(item);
    }
  });
  
  return [truthy, falsy];
}

/**
 * Get sum of numeric array
 */
export function sum(array: number[]): number {
  return array.reduce((total, num) => total + num, 0);
}

/**
 * Get average of numeric array
 */
export function average(array: number[]): number {
  return array.length > 0 ? sum(array) / array.length : 0;
}

/**
 * Get minimum value from numeric array
 */
export function min(array: number[]): number {
  return Math.min(...array);
}

/**
 * Get maximum value from numeric array
 */
export function max(array: number[]): number {
  return Math.max(...array);
}

/**
 * Get sum of object property values
 */
export function sumBy<T>(array: T[], key: keyof T): number {
  return array.reduce((total, item) => {
    const value = item[key];
    return total + (typeof value === 'number' ? value : 0);
  }, 0);
}

/**
 * Get average of object property values
 */
export function averageBy<T>(array: T[], key: keyof T): number {
  return array.length > 0 ? sumBy(array, key) / array.length : 0;
}

/**
 * Get minimum value from object property
 */
export function minBy<T>(array: T[], key: keyof T): T | undefined {
  return array.reduce((min, item) => {
    const value = item[key];
    const minValue = min[key];
    return value < minValue ? item : min;
  });
}

/**
 * Get maximum value from object property
 */
export function maxBy<T>(array: T[], key: keyof T): T | undefined {
  return array.reduce((max, item) => {
    const value = item[key];
    const maxValue = max[key];
    return value > maxValue ? item : max;
  });
}

/**
 * Create array of numbers in range
 */
export function range(start: number, end: number, step: number = 1): number[] {
  const result: number[] = [];
  for (let i = start; i < end; i += step) {
    result.push(i);
  }
  return result;
}

/**
 * Create array with repeated value
 */
export function repeat<T>(value: T, count: number): T[] {
  return Array(count).fill(value);
}

/**
 * Zip multiple arrays together
 */
export function zip<T>(...arrays: T[][]): T[][] {
  const maxLength = Math.max(...arrays.map(arr => arr.length));
  const result: T[][] = [];
  
  for (let i = 0; i < maxLength; i++) {
    result.push(arrays.map(arr => arr[i]));
  }
  
  return result;
}

/**
 * Transpose 2D array (swap rows and columns)
 */
export function transpose<T>(matrix: T[][]): T[][] {
  if (matrix.length === 0) return [];
  return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
}
