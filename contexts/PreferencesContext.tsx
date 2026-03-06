import React, { createContext, useContext, useEffect, useState } from 'react';
import { CURRENCIES, LANGUAGES } from '../constants';
import { useExchangeRate } from './ExchangeRateContext';

interface Currency {
  code: string;
  name: string;
  symbol: string;
  rate: number;
}

interface Language {
  code: string;
  name: string;
  region: string;
}

interface PreferencesContextType {
  currency: Currency;
  language: Language;
  setCurrency: (code: string) => void;
  setLanguage: (code: string) => void;
  formatPrice: (amountInUSD: number) => string;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<Currency>(CURRENCIES[0]); // Default USD
  const [language, setLanguageState] = useState<Language>(LANGUAGES[0]); // Default en-US
  const { usdToNgnRate } = useExchangeRate();

  useEffect(() => {
    // Load saved preferences
    if (typeof window !== 'undefined') {
      const savedCurrencyCode = localStorage.getItem('fleet-iq-currency');
      const savedLangCode = localStorage.getItem('fleet-iq-language');

      if (savedCurrencyCode) {
        const foundCurr = CURRENCIES.find(c => c.code === savedCurrencyCode);
        if (foundCurr) setCurrencyState(foundCurr);
      } else {
        // If no saved currency, try to auto-detect based on IP using a high-limit free provider
        fetch('https://get.geojs.io/v1/ip/country.json')
          .then(res => res.json())
          .then(data => {
            if (data && data.country) {
              if (data.country === 'NG') {
                const ngn = CURRENCIES.find(c => c.code === 'NGN');
                if (ngn) setCurrencyState(ngn);
              } else {
                const usd = CURRENCIES.find(c => c.code === 'USD');
                if (usd) setCurrencyState(usd);
              }
            }
          })
          .catch(err => {
            console.error('Failed to auto-detect currency by IP:', err);
          });
      }

      if (savedLangCode) {
        const foundLang = LANGUAGES.find(l => l.code === savedLangCode);
        if (foundLang) setLanguageState(foundLang);
      }
    }
  }, []);

  const setCurrency = (code: string) => {
    const found = CURRENCIES.find(c => c.code === code);
    if (found) {
      // If we are setting to NGN, override the hardcoded rate with the live one
      if (code === 'NGN') {
        setCurrencyState({ ...found, rate: usdToNgnRate });
      } else {
        setCurrencyState(found);
      }
      localStorage.setItem('fleet-iq-currency', code);
    }
  };

  // Keep the currency object's live rate updated if usdToNgnRate changes in the background
  useEffect(() => {
    if (currency.code === 'NGN' && currency.rate !== usdToNgnRate) {
      setCurrencyState(prev => ({ ...prev, rate: usdToNgnRate }));
    }
  }, [usdToNgnRate, currency.code]);

  const setLanguage = (code: string) => {
    const found = LANGUAGES.find(l => l.code === code);
    if (found) {
      setLanguageState(found);
      localStorage.setItem('fleet-iq-language', code);
    }
  };

  const formatPrice = (amountInUSD: number) => {
    const effectiveRate = currency.code === 'NGN' ? usdToNgnRate : currency.rate;
    const converted = amountInUSD * effectiveRate;

    // We format the number using the selected locale for correct comma/decimal separators
    const numberPart = new Intl.NumberFormat(language.code, {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(converted);

    // We manually attach the symbol from our constants to ensure it displays correctly
    // (e.g., ensuring '₦' displays instead of 'NGN')
    return `${currency.symbol} ${numberPart}`;
  };

  return (
    <PreferencesContext.Provider value={{ currency, language, setCurrency, setLanguage, formatPrice }}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};