import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container, Typography, Box, Button, Paper, TextField,
    Tab, Tabs, Alert, CircularProgress, Divider, Chip
} from '@mui/material';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import api from '../services/api';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

// Card payment form using Stripe Elements
const CardPaymentForm = ({ clientSecret, auctionId, amountBDT, onSuccess }) => {
    const stripe   = useStripe();
    const elements = useElements();
    const [error,     setError]     = useState("");
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!stripe || !elements) return;
        setProcessing(true); setError("");
        try {
            const { error: stripeError, paymentIntent } =
                await stripe.confirmCardPayment(clientSecret, {
                    payment_method: { card: elements.getElement(CardElement) }
                });
            if (stripeError) { setError(stripeError.message); return; }
            await api.post(`/payments/${auctionId}/confirm`, {
                paymentIntentId: paymentIntent.id,
                method: "card"
            });
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || "Payment failed");
        } finally { setProcessing(false); }
    };

    return (
        <Box component="form" onSubmit={handleSubmit}>
            <Typography variant="h6" gutterBottom>Card Details</Typography>
            <Paper sx={{ p: 2, mb: 2 }}>
                <CardElement options={{
                    style: { base: { fontSize: "16px" } },
                    hidePostalCode: true
                }} />
            </Paper>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Amount: <strong>BDT {amountBDT?.toLocaleString()}</strong>
                {" "}(processed as USD equivalent)
            </Typography>
            <Button type="submit" fullWidth variant="contained" size="large"
                disabled={!stripe || processing}>
                {processing ? "Processing..." : `Pay BDT ${amountBDT?.toLocaleString()}`}
            </Button>
        </Box>
    );
};

// Mobile banking form (Nagad / Bkash)
const MobileBankingForm = ({ auctionId, amountBDT, method, onSuccess }) => {
    const [phone,     setPhone]     = useState("");
    const [pin,       setPin]       = useState("");
    const [error,     setError]     = useState("");
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async () => {
        if (!phone || phone.length < 11) { setError("Enter valid phone number"); return; }
        if (!pin || pin.length < 4)      { setError("Enter valid PIN"); return; }
        setProcessing(true); setError("");
        try {
            // Simulate payment success for demo
            await new Promise(r => setTimeout(r, 1500));
            await api.post(`/payments/${auctionId}/confirm`, {
                paymentIntentId: `mobile_${Date.now()}`,
                method
            });
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || "Payment failed");
        } finally { setProcessing(false); }
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                {method === "nagad" ? "Nagad" : "bKash"} Payment
            </Typography>
            <TextField fullWidth label="Mobile Number" value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="01XXXXXXXXX" sx={{ mb: 2 }} />
            <TextField fullWidth label="PIN" type="password" value={pin}
                onChange={e => setPin(e.target.value)}
                placeholder="Enter your PIN" sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Amount: <strong>BDT {amountBDT?.toLocaleString()}</strong>
            </Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Button fullWidth variant="contained" size="large"
                onClick={handleSubmit} disabled={processing}
                sx={{ bgcolor: method === "nagad" ? "#FF6600" : "#E2136E",
                     "&:hover": { bgcolor: method === "nagad" ? "#e55c00" : "#c1105e" } }}>
                {processing ? "Processing..." : `Pay BDT ${amountBDT?.toLocaleString()}`}
            </Button>
        </Box>
    );
};

// Main payment page
const PaymentPage = () => {
    const { auctionId } = useParams();
    const navigate = useNavigate();
    const [paymentTab,    setPaymentTab]    = useState(0); // 0=card, 1=mobile
    const [mobileMethod,  setMobileMethod]  = useState("nagad");
    const [clientSecret,  setClientSecret]  = useState("");
    const [amountBDT,     setAmountBDT]     = useState(0);
    const [auctionTitle,  setAuctionTitle]  = useState("");
    const [loading,       setLoading]       = useState(true);
    const [error,         setError]         = useState("");
    const [paid,          setPaid]          = useState(false);

    useEffect(() => {
        api.post(`/payments/${auctionId}/create-intent`)
           .then(res => {
               setClientSecret(res.data.clientSecret);
               setAmountBDT(res.data.amountBDT);
               setAuctionTitle(res.data.auctionTitle);
           })
           .catch(err => setError(err.response?.data?.message || "Failed to load payment"))
           .finally(() => setLoading(false));
    }, [auctionId]);

    const handleSuccess = () => setPaid(true);

    if (loading) return <Container sx={{ py: 4, textAlign: "center" }}><CircularProgress /></Container>;

    if (paid) return (
        <Container maxWidth="sm" sx={{ py: 8, textAlign: "center" }}>
            <Typography variant="h4" color="success.main" gutterBottom>
                ✓ Payment Successful!
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
                Your payment of BDT {amountBDT?.toLocaleString()} for "{auctionTitle}" was successful.
            </Typography>
            <Button variant="contained" onClick={() => navigate("/profile")}>
                Go to My Profile
            </Button>
        </Container>
    );

    return (
        <Container maxWidth="sm" sx={{ py: 4 }}>
            <Button onClick={() => navigate(-1)} sx={{ mb: 2 }}>← Back</Button>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
                Complete Payment
            </Typography>
            <Paper sx={{ p: 2, mb: 3, bgcolor: "success.light" }}>
                <Typography variant="body1" fontWeight="bold">
                    {auctionTitle}
                </Typography>
                <Typography variant="h5" color="success.dark">
                    BDT {amountBDT?.toLocaleString()}
                </Typography>
            </Paper>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Tabs value={paymentTab} onChange={(_, v) => setPaymentTab(v)} sx={{ mb: 3 }}>
                <Tab label="Card" />
                <Tab label="Mobile Banking" />
            </Tabs>
            {paymentTab === 0 && clientSecret && (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <CardPaymentForm clientSecret={clientSecret}
                        auctionId={auctionId} amountBDT={amountBDT}
                        onSuccess={handleSuccess} />
                </Elements>
            )}
            {paymentTab === 1 && (
                <Box>
                    <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                        {["nagad", "bkash"].map(m => (
                            <Button key={m}
                                variant={mobileMethod === m ? "contained" : "outlined"}
                                onClick={() => setMobileMethod(m)}
                                sx={{ flex: 1, textTransform: "capitalize",
                                     bgcolor: mobileMethod===m ?
                                         (m==="nagad" ? "#FF6600" : "#E2136E") : "transparent",
                                     borderColor: m==="nagad" ? "#FF6600" : "#E2136E",
                                     color: mobileMethod===m ? "white" :
                                         (m==="nagad" ? "#FF6600" : "#E2136E")
                                }}>
                                {m === "nagad" ? "Nagad" : "bKash"}
                            </Button>
                        ))}
                    </Box>
                    <MobileBankingForm auctionId={auctionId}
                        amountBDT={amountBDT} method={mobileMethod}
                        onSuccess={handleSuccess} />
                </Box>
            )}
        </Container>
    );
};

export default PaymentPage;