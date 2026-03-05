/**
 * GET /api/subscriptions
 * Returns all detected recurring payments with unused flags.
 */

const express = require('express');
const router = express.Router();
const Subscription = require('../models/Subscription');

router.get('/', async (req, res) => {
    try {
        const { user_id = 'default_user' } = req.query;

        const subs = await Subscription.find({ user_id, is_active: true }).sort({ amount: -1 });

        const subscriptions = subs.map(s => {
            const obj = {
                merchant: s.merchant,
                amount: s.amount,
                frequency: s.frequency,
                status: s.status,
                days_unused: s.days_since_last_use,
                last_used: s.last_transaction_date,
            };
            if (s.status === 'unused') {
                obj.warning = `Not used for ${Math.round(s.days_since_last_use / 30)} months—consider cancelling`;
            }
            return obj;
        });

        const total_monthly = subs.reduce((sum, s) => sum + s.amount, 0);

        res.json({ total_monthly, count: subscriptions.length, subscriptions });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── PATCH /api/subscriptions/:id/cancel  ──────────────────────────────────
router.patch('/:id/cancel', async (req, res) => {
    try {
        const sub = await Subscription.findByIdAndUpdate(
            req.params.id,
            { status: 'cancelled', is_active: false },
            { new: true }
        );
        if (!sub) return res.status(404).json({ error: 'Subscription not found' });
        res.json({ success: true, subscription: sub });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
