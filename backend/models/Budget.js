const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
    user_id: { type: String, default: 'default_user' },
    month: { type: String, required: true },   // "YYYY-MM"
    budgets: {
        Food: { type: Number, default: 0 },
        Transport: { type: Number, default: 0 },
        Shopping: { type: Number, default: 0 },
        Bills: { type: Number, default: 0 },
        Entertainment: { type: Number, default: 0 },
        Subscriptions: { type: Number, default: 0 },
        Other: { type: Number, default: 0 },
    },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Budget', budgetSchema);
