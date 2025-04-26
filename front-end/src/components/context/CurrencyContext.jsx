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
  const [exchangeRates, setExchangeRates] = useState({ [BASE_CURRENCY]: 1 }); // Store rates relative to base
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

    useEffect(() => {
    const fetchRates = async () => {
      if (!API_KEY ) {
        setError('API Key not configured in CurrencyContext.jsx');
        console.error('ERROR: API Key for ExchangeRate-API is missing or invalid.');
        setLoading(false);
        setExchangeRates(prev => ({ ...prev, 'VND': 25000 })); // Example fallback rate
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`https://v6.exchangerate-api.com/v6/${API_KEY}/latest/${BASE_CURRENCY}`);
    
        if (!response.ok) {
          const errorData = await response.json();
           throw new Error(errorData['error-type'] || `HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log(data);
        if (data.result === 'success' && data.conversion_rates) {
            // Ensure we have rates for all supported currencies relative to the base
            const rates = SUPPORTED_CURRENCIES.reduce((acc, curr) => {
              if (data.conversion_rates[curr]) {
                acc[curr] = data.conversion_rates[curr];
              } else {
                console.warn(`Rate for ${curr} not found in API response.`);
                // Decide fallback: maybe keep previous rate or set to 1?
                acc[curr] = 1;
              }
              return acc;
            }, {});
             rates[BASE_CURRENCY] = 1; // Ensure base is always 1
             setExchangeRates(rates);
        } else {
            throw new Error(data['error-type'] || 'Failed to fetch valid rates data.');
        }

      } catch (err) {
        setError(err.message || 'Could not fetch exchange rates.');
        console.error("Error fetching exchange rates:", err);
        // Optionally set fallback rates on error
        setExchangeRates(prev => ({ ...prev, 'VND': prev['VND'] || 25000 })); // Keep existing VND rate or use fallback
      } finally {
        setLoading(false);
      }
    };

    fetchRates();
  }, []);

  // --- Change Currency Function ---
  const changeCurrency = useCallback((newCurrency) => {
    if (SUPPORTED_CURRENCIES.includes(newCurrency)) {
      setSelectedCurrency(newCurrency);
    }
  }, []); // Empty dependency array is safe here

  // --- Conversion and Formatting Function ---
  const convertAndFormat = useCallback((valueInBase) => {
    // Handle loading state first
    if (loading) return '...';
    // Handle invalid input number
    valueInBase = parseFloat(valueInBase);
    if (isNaN(valueInBase)) {
        return 'N/A'; 
    }
    // Handle error state (show base currency value + error)
    if (error || !exchangeRates[selectedCurrency]) {
        // Format the original base value using the BASE currency formatter
        return `${formatCurrency(valueInBase, BASE_CURRENCY)} (Error)`;
    }

    // If no error and not loading, proceed with conversion
    const rate = exchangeRates[selectedCurrency]; // Already checked existence
    const convertedValue = valueInBase * rate;
    return formatCurrency(convertedValue, selectedCurrency);

  }, [selectedCurrency, exchangeRates, loading, error]);
  const value = {
    selectedCurrency,
    exchangeRates, // Raw rates might be useful elsewhere
    loading,
    error,
    changeCurrency,
    convertAndFormat, // Provide the combined function
    formatCurrency, // Provide the basic formatter too if needed
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