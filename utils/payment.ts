
export interface PaymentConfig {
    publicKey: string;
    amount: number;
    email: string;
    currency: string;
    onSuccess: (reference: string) => void;
    onClose: () => void;
}

export const initializePayment = async (config: PaymentConfig) => {
    // TODO: Implement Nomba/Paystack initialization here
    console.log('Initializing payment with config:', config);

    // Mock success for testing UI flow (USER MUST PROVIDE KEYS TO ENABLE REAL PAYMENT)
    // setTimeout(() => {
    //   config.onSuccess('mock-ref-' + Date.now());
    // }, 2000);
};
