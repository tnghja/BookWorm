import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';

const API_KEY = '6cca38d245651f47328044b8';
const BASE_CURRENCY = 'USD';
const SUPPORTED_CURRENCIES = ['USD', 'VND'];

const formatCurrency = (value, currencyCode) => {
  if (typeof value !== 'number' || isNaN(value)) {
    return `${currencyCode} ---`;
  }
  const options = {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: currencyCode === 'VND' ? 0 : 2,
    maximumFractionDigits: currencyCode === 'VND' ? 0 : 2,
  };
  const locale = currencyCode === 'VND' ? 'vi-VN' : 'en-US';

  try {
    return new Intl.NumberFormat(locale, options).format(value);
  } catch (error) {
    console.error("Currency formatting error:", error);
        return `${currencyCode} ${value.toFixed(options.minimumFractionDigits)}`;
  }
};

const CurrencyContext = createContext(null);

export const CurrencyProvider = ({ children }) => {
  const [selectedCurrency, setSelectedCurrency] = useState(BASE_CURRENCY);
  const [exchangeRates, setExchangeRates] = useState({ [BASE_CURRENCY]: 1 }); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRates = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`https://v6.exchangerate-api.com/v6/${API_KEY}/latest/${BASE_CURRENCY}`);
    
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData['error-type'] || `HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.result === 'success' && data.conversion_rates) {
          const rates = SUPPORTED_CURRENCIES.reduce((acc, curr) => {
            if (data.conversion_rates[curr]) {
              acc[curr] = data.conversion_rates[curr];
            } else {
              acc[curr] = 1;
            }
            return acc;
          }, {});
          rates[BASE_CURRENCY] = 1; 
          setExchangeRates(rates);
        } else {
          throw new Error(data['error-type'] || 'Failed to fetch valid rates data.');
        }

      } catch (err) {
        setError(err.message || 'Could not fetch exchange rates.');
        setExchangeRates(prev => ({ ...prev, 'VND': prev['VND'] || 25000 }));
      } finally {
        setLoading(false);
      }
    };

    fetchRates();
  }, []);

  const changeCurrency = useCallback((newCurrency) => {
    if (SUPPORTED_CURRENCIES.includes(newCurrency)) {
      setSelectedCurrency(newCurrency);
    }
  }, []);

  const convertAndFormat = useCallback((valueInBase) => {
    if (loading) return '...';
    valueInBase = parseFloat(valueInBase);
    if (isNaN(valueInBase)) {
      return 'N/A'; 
    }
    if (error || !exchangeRates[selectedCurrency]) {
      return `${formatCurrency(valueInBase, BASE_CURRENCY)} (Error)`;
    }

    const rate = exchangeRates[selectedCurrency]; 
    const convertedValue = valueInBase * rate;
    return formatCurrency(convertedValue, selectedCurrency);

  }, [selectedCurrency, exchangeRates, loading, error]);
  const value = {
    selectedCurrency,
    exchangeRates, 
    loading,
    error,
    changeCurrency,
    convertAndFormat, 
    formatCurrency, 
    supportedCurrencies: SUPPORTED_CURRENCIES,
    baseCurrency: BASE_CURRENCY,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};