const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    user_id: { type: String, default: 'default_user' },
    date: { type: String, required: true },         // "YYYY-MM-DD"
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    category: { type: String, enum: ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Subscriptions', 'Other'], default: 'Other' },
    merchant: { type: String, default: '' },
    is_recurring: { type: Boolean, default: false },
    month: { type: String, required: true },          // "YYYY-MM"
    created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Transaction', transactionSchema);
