import paypal from '@paypal/checkout-server-sdk';

const Environment = process.env.PAYPAL_ENVIRONMENT === 'production'
    ? paypal.core.LiveEnvironment
    : paypal.core.SandboxEnvironment;

export const getPaypalClient = () => {
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
        throw new Error("PayPal Client ID or Secret are missing from environment variables.");
    }
    return new paypal.core.PayPalHttpClient(
        new Environment(
            process.env.PAYPAL_CLIENT_ID,
            process.env.PAYPAL_CLIENT_SECRET
        )
    );
};
