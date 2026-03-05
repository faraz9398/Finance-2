const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    user_id: { type: String, default: 'default_user' },
    merchant: { type: String, required: true },
    category: { type: String, default: 'Subscriptions' },
    amount: { type: Number, required: true },
    frequency: { type: String, default: 'monthly' },
    last_transaction_date: { type: String },
    detected_at: { type: Date, default: Date.now },
    is_active: { type: Boolean, default: true },
    days_since_last_use: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'unused', 'cancelled'], default: 'active' },
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
