// Nomba Credentials (TEST MODE)
// WARNING: In a production environment, these must be stored on the SERVER side (Edge Functions)
// and never exposed to the client.
const NOMBA_CONFIG = {
    clientId: '2dbbe0a4-2ec0-4129-8722-6160cb574964',
    accountId: '532b1959-9d30-4481-afa0-4a41c56f1be4',
    privateKey: '2n7GCmO9jEDfWBHWP4J951YE1YvV/LMBDDU+jmUfLP537WWwPuhS3BShMdDV9759WJ94SBzGvUCEGNLR7SZVbA==', // DANGEROUS IN FRONTEND
    baseUrl: '/api/nomba', // Use local proxy to bypass CORS
};

interface PaymentDetails {
    amount: number;
    email: string;
    currency: string;
    customerName: string;
    callbackUrl: string;
}

export const initializeNombaPayment = async (details: PaymentDetails) => {
    try {
        const orderReference = `FLEET-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // Nomba Checkout API payload for /v1/checkout/order
        // Production environment API call
        const payload = {
            order: {
                orderReference: orderReference,
                callbackUrl: details.callbackUrl,
                currency: 'NGN',
                amount: details.amount.toFixed(2),
                description: `Rental for ${details.customerName}`,
                customerEmail: details.email,
                customerName: details.customerName
            }
        };

        // Determine exactly where the API request should go.
        // For local development on mobile, we must append the current window origin 
        // to forcefully route through the Vite proxy running on the host IP.
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const resolvedBaseUrl = `${origin}${NOMBA_CONFIG.baseUrl}`;

        console.log("Initializing Nomba Payment (Proxy via " + resolvedBaseUrl + ")...", payload);

        // 1. Fetch Access Token
        const tokenResponse = await fetch(`${resolvedBaseUrl}/auth/token/issue`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'accountId': NOMBA_CONFIG.accountId
            },
            body: JSON.stringify({
                grant_type: 'client_credentials',
                client_id: NOMBA_CONFIG.clientId,
                client_secret: NOMBA_CONFIG.privateKey
            })
        });

        const tokenData = await tokenResponse.json();
        if (!tokenResponse.ok || !tokenData.data?.access_token) {
            console.error('Nomba Auth Error:', tokenData);
            throw new Error('Failed to authenticate with payment gateway.');
        }

        const accessToken = tokenData.data.access_token;

        // 2. Initialize Checkout Order
        const response = await fetch(`${resolvedBaseUrl}/checkout/order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'accountId': NOMBA_CONFIG.accountId,
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify(payload)
        });

        const rawText = await response.text();
        let data: any = {};
        try {
            data = rawText ? JSON.parse(rawText) : {};
        } catch (e) {
            console.error("Failed to parse Nomba response as JSON. Raw text:", rawText);
        }

        if (!response.ok) {
            console.error('Nomba API Error Response:', data, 'Raw:', rawText);
            throw new Error(data.message || data.description || `Payment initialization failed: ${response.status} ${response.statusText}`);
        }

        return {
            checkoutUrl: data.data.checkoutLink,
            orderReference: orderReference
        };

    } catch (error: any) {
        console.error('Payment Error Details:', error);
        if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
            throw new Error("Network Error: Likely CORS issue. APIs cannot be called directly from localhost. Please check console.");
        }
        throw error;
    }
};
