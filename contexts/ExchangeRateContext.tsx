import React, { createContext, useContext, useState, useEffect } from 'react';

interface ExchangeRateContextType {
    usdToNgnRate: number;
    isLoadingRate: boolean;
    rateError: string | null;
}

const ExchangeRateContext = createContext<ExchangeRateContextType>({
    usdToNgnRate: 1650, // Fallback default
    isLoadingRate: true,
    rateError: null,
});

export const ExchangeRateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Try to get cached rate on first render, fallback to 1650
    const getInitialRate = () => {
        if (typeof window !== 'undefined') {
            const cached = localStorage.getItem('fleet_iq_exchange_cache');
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    const isExpired = Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000;
                    if (!isExpired && parsed.rate && !isNaN(Number(parsed.rate))) {
                        return Number(parsed.rate);
                    }
                } catch (e) { }
            }
        }
        return 1650;
    };

    const [usdToNgnRate, setUsdToNgnRate] = useState<number>(getInitialRate);
    const [isLoadingRate, setIsLoadingRate] = useState<boolean>(true);
    const [rateError, setRateError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLiveRate = async () => {
            try {
                // Check if we have a valid 24-hour cache first
                const cached = localStorage.getItem('fleet_iq_exchange_cache');
                if (cached) {
                    try {
                        const parsed = JSON.parse(cached);
                        const isExpired = Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000;
                        if (!isExpired && parsed.rate) {
                            setUsdToNgnRate(Number(parsed.rate));
                            setIsLoadingRate(false);
                            return; // Trap active: Skip API call
                        }
                    } catch (e) { }
                }

                setIsLoadingRate(true);
                // Using a reliable free, no-auth exchange rate API
                const response = await fetch('https://open.er-api.com/v6/latest/USD');

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();

                if (data && data.rates && data.rates.NGN) {
                    // Add a slight buffer (e.g., 20 NGN) to account for payment gateway exchange rate spreads
                    const buffer = 20;
                    const finalRate = Math.round(data.rates.NGN + buffer);

                    setUsdToNgnRate(finalRate);
                    setRateError(null);

                    // Save to cache with exactly 24 hour timestamp
                    localStorage.setItem('fleet_iq_exchange_cache', JSON.stringify({
                        rate: finalRate,
                        timestamp: Date.now()
                    }));
                    console.log(`Live Exchange Rate fetched and trapped for 24hrs: 1 USD = ${finalRate} NGN`);
                } else {
                    throw new Error("NGN rate not found in API response.");
                }
            } catch (err: any) {
                console.error("Failed to fetch live exchange rate, falling back to cache or 1650:", err);
                setRateError(err.message || 'Failed to fetch rate');
            } finally {
                setIsLoadingRate(false);
            }
        };

        fetchLiveRate();

        // Refresh rate every 24 hours
        const intervalId = setInterval(fetchLiveRate, 24 * 60 * 60 * 1000);
        return () => clearInterval(intervalId);
    }, []);

    return (
        <ExchangeRateContext.Provider value={{ usdToNgnRate, isLoadingRate, rateError }}>
            {children}
        </ExchangeRateContext.Provider>
    );
};

export const useExchangeRate = () => useContext(ExchangeRateContext);
