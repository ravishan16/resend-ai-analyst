import { describe, it, expect } from 'vitest';
import { 
  STOCK_UNIVERSE, 
  QUALITY_THRESHOLDS, 
  VOLATILITY_THRESHOLDS,
  isInStockUniverse,
  getQualityThreshold,
  getVolatilityThreshold
} from '../src/config.js';

describe('Config', () => {
  describe('STOCK_UNIVERSE', () => {
    it('should contain major tech stocks', () => {
      expect(STOCK_UNIVERSE).toContain('AAPL');
      expect(STOCK_UNIVERSE).toContain('MSFT');
      expect(STOCK_UNIVERSE).toContain('GOOGL');
      expect(STOCK_UNIVERSE).toContain('AMZN');
      expect(STOCK_UNIVERSE).toContain('NVDA');
    });

    it('should be an array of strings', () => {
      expect(Array.isArray(STOCK_UNIVERSE)).toBe(true);
      expect(STOCK_UNIVERSE.length).toBeGreaterThan(0);
      STOCK_UNIVERSE.forEach(symbol => {
        expect(typeof symbol).toBe('string');
        expect(symbol.length).toBeGreaterThan(0);
      });
    });

    it('should contain only uppercase symbols', () => {
      STOCK_UNIVERSE.forEach(symbol => {
        expect(symbol).toBe(symbol.toUpperCase());
      });
    });

    it('should not contain duplicates', () => {
      const uniqueSymbols = [...new Set(STOCK_UNIVERSE)];
      expect(uniqueSymbols.length).toBe(STOCK_UNIVERSE.length);
    });
  });

  describe('QUALITY_THRESHOLDS', () => {
    it('should have minimum volatility score threshold', () => {
      expect(QUALITY_THRESHOLDS).toHaveProperty('minVolatilityScore');
      expect(typeof QUALITY_THRESHOLDS.minVolatilityScore).toBe('number');
      expect(QUALITY_THRESHOLDS.minVolatilityScore).toBeGreaterThan(0);
    });

    it('should have minimum days to earnings', () => {
      expect(QUALITY_THRESHOLDS).toHaveProperty('minDaysToEarnings');
      expect(typeof QUALITY_THRESHOLDS.minDaysToEarnings).toBe('number');
      expect(QUALITY_THRESHOLDS.minDaysToEarnings).toBeGreaterThanOrEqual(0);
    });

    it('should have maximum days to earnings', () => {
      expect(QUALITY_THRESHOLDS).toHaveProperty('maxDaysToEarnings');
      expect(typeof QUALITY_THRESHOLDS.maxDaysToEarnings).toBe('number');
      expect(QUALITY_THRESHOLDS.maxDaysToEarnings).toBeGreaterThan(QUALITY_THRESHOLDS.minDaysToEarnings);
    });
  });

  describe('VOLATILITY_THRESHOLDS', () => {
    it('should have implied volatility thresholds', () => {
      expect(VOLATILITY_THRESHOLDS).toHaveProperty('minImpliedVolatility');
      expect(VOLATILITY_THRESHOLDS).toHaveProperty('maxImpliedVolatility');
      expect(typeof VOLATILITY_THRESHOLDS.minImpliedVolatility).toBe('number');
      expect(typeof VOLATILITY_THRESHOLDS.maxImpliedVolatility).toBe('number');
      expect(VOLATILITY_THRESHOLDS.maxImpliedVolatility).toBeGreaterThan(VOLATILITY_THRESHOLDS.minImpliedVolatility);
    });

    it('should have historical volatility thresholds', () => {
      expect(VOLATILITY_THRESHOLDS).toHaveProperty('minHistoricalVolatility');
      expect(VOLATILITY_THRESHOLDS).toHaveProperty('maxHistoricalVolatility');
      expect(typeof VOLATILITY_THRESHOLDS.minHistoricalVolatility).toBe('number');
      expect(typeof VOLATILITY_THRESHOLDS.maxHistoricalVolatility).toBe('number');
      expect(VOLATILITY_THRESHOLDS.maxHistoricalVolatility).toBeGreaterThan(VOLATILITY_THRESHOLDS.minHistoricalVolatility);
    });
  });

  describe('isInStockUniverse', () => {
    it('should return true for symbols in universe', () => {
      expect(isInStockUniverse('AAPL')).toBe(true);
      expect(isInStockUniverse('MSFT')).toBe(true);
      expect(isInStockUniverse('GOOGL')).toBe(true);
    });

    it('should return false for symbols not in universe', () => {
      expect(isInStockUniverse('XYZ')).toBe(false);
      expect(isInStockUniverse('INVALID')).toBe(false);
      expect(isInStockUniverse('')).toBe(false);
    });

    it('should be case sensitive', () => {
      expect(isInStockUniverse('aapl')).toBe(false);
      expect(isInStockUniverse('AAPL')).toBe(true);
    });

    it('should handle null and undefined', () => {
      expect(isInStockUniverse(null)).toBe(false);
      expect(isInStockUniverse(undefined)).toBe(false);
    });
  });

  describe('getQualityThreshold', () => {
    it('should return threshold values for valid keys', () => {
      expect(getQualityThreshold('minVolatilityScore')).toBe(QUALITY_THRESHOLDS.minVolatilityScore);
      expect(getQualityThreshold('minDaysToEarnings')).toBe(QUALITY_THRESHOLDS.minDaysToEarnings);
      expect(getQualityThreshold('maxDaysToEarnings')).toBe(QUALITY_THRESHOLDS.maxDaysToEarnings);
    });

    it('should return undefined for invalid keys', () => {
      expect(getQualityThreshold('invalidKey')).toBeUndefined();
      expect(getQualityThreshold('')).toBeUndefined();
      expect(getQualityThreshold(null)).toBeUndefined();
    });
  });

  describe('getVolatilityThreshold', () => {
    it('should return threshold values for valid keys', () => {
      expect(getVolatilityThreshold('minImpliedVolatility')).toBe(VOLATILITY_THRESHOLDS.minImpliedVolatility);
      expect(getVolatilityThreshold('maxImpliedVolatility')).toBe(VOLATILITY_THRESHOLDS.maxImpliedVolatility);
      expect(getVolatilityThreshold('minHistoricalVolatility')).toBe(VOLATILITY_THRESHOLDS.minHistoricalVolatility);
      expect(getVolatilityThreshold('maxHistoricalVolatility')).toBe(VOLATILITY_THRESHOLDS.maxHistoricalVolatility);
    });

    it('should return undefined for invalid keys', () => {
      expect(getVolatilityThreshold('invalidKey')).toBeUndefined();
      expect(getVolatilityThreshold('')).toBeUndefined();
      expect(getVolatilityThreshold(null)).toBeUndefined();
    });
  });
});