/**
 * Payment Controller
 * Simulates payment processing for bookings.
 * Supports Card, UPI, and Net Banking methods.
 */

/**
 * POST /api/payments/process
 * Simulate payment processing
 * Body: { method, amount, cardNumber?, upiId?, bankName? }
 */
async function processPayment(req, res) {
  try {
    const { method, amount } = req.body;

    if (!method || !amount) {
      return res.status(400).json({ error: 'Payment method and amount are required.' });
    }

    // Simulate processing delay (500ms-1.5s)
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    // Generate a mock transaction ID
    const transactionId = 'TXN' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();

    res.json({
      success: true,
      transactionId,
      method,
      amount: parseFloat(amount),
      status: 'completed',
      timestamp: new Date().toISOString(),
      message: 'Payment processed successfully!'
    });
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ error: 'Payment processing failed.' });
  }
}

module.exports = { processPayment };
