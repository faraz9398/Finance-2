/**
 * POST /api/transactions/upload
 * Accepts { transactions: [{date, amount, description}] }
 * Categorises each with Gemini, stores in MongoDB, detects recurring payments.
 */

const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const Transaction = require('../models/Transaction');
const Subscription = require('../models/Subscription');

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Subscriptions', 'Other'];

// ── Helper: determine "YYYY-MM" from a date string ─────────────────────────
function toMonth(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d)) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
}

// ── Rule-based fallback ──────────────────────────────────────────────────────
function ruleBased(desc) {
    const d = (desc || '').toLowerCase();
    if (/netflix|spotify|prime|hotstar|game pass|apple.*one|youtube.*premium|zee5|disney/i.test(d)) return 'Subscriptions';
    if (/swiggy|zomato|starbucks|mcdonald|burger|restaurant|cafe|food|eat|kfc|pizza|dominos|dine|dunkin|subway|haldiram/i.test(d)) return 'Food';
    if (/uber|ola|rapido|metro|bus|train|cab|taxi|petrol|fuel|irctc|railway|flight|indigo|spicejet/i.test(d)) return 'Transport';
    if (/amazon|flipkart|myntra|meesho|nykaa|ajio|shop|mall|market|h&m|zara|ikea|reliance smart/i.test(d)) return 'Shopping';
    if (/airtel|jio|bsnl|vodafone|electricity|electric|water|gas|utility|broadband|internet|wifi|bill|emi|loan|insurance/i.test(d)) return 'Bills';
    if (/movie|cinema|pvr|inox|concert|event|game|gaming|fun|entertainment/i.test(d)) return 'Entertainment';
    return 'Other';
}

// ── Gemini categorisation (batched to keep costs low) ────────────────────────
async function categoriseTransactions(transactions) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === 'YOUR_GEMINI_API_KEY') {
        console.log('No Gemini key — using rule-based categorisation');
        return transactions.map(t => ({ ...t, category: ruleBased(t.description) }));
    }

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Batch all descriptions into a single prompt to save quota
    const descriptions = transactions.map((t, i) => `${i + 1}. ${t.description}`).join('\n');

    const prompt = `Categorise each transaction description into exactly one of these categories:
Food, Transport, Shopping, Bills, Entertainment, Subscriptions, Other

Return ONLY a valid JSON array of strings, one per description, in the same order.
Example: ["Food","Transport","Shopping"]

Descriptions:
${descriptions}`;

    try {
        const result = await model.generateContent(prompt);
        const raw = result.response.text().trim();

        // Extract first JSON array found in the response
        const match = raw.match(/\[[\s\S]*?\]/);
        if (!match) throw new Error('No JSON array in Gemini response');
        const categories = JSON.parse(match[0]);

        return transactions.map((t, i) => ({
            ...t,
            category: CATEGORIES.includes(categories[i]) ? categories[i] : 'Other',
        }));
    } catch (err) {
        console.error('Gemini categorisation failed, falling back to rule-based:', err.message);
        return transactions.map(t => ({ ...t, category: ruleBased(t.description) }));
    }
}

// ── Detect recurring payments & update subscriptions collection ───────────────
async function detectRecurring(userId) {
    const txns = await Transaction.find({ user_id: userId }).sort({ date: 1 });

    // Group by merchant + amount
    const groups = {};
    for (const t of txns) {
        const key = `${t.merchant || t.description}|||${t.amount}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(t);
    }

    // If a combo appears in ≥ 2 different months → recurring
    for (const [key, entries] of Object.entries(groups)) {
        const uniqueMonths = [...new Set(entries.map(e => e.month))];
        if (uniqueMonths.length >= 2) {
            const [merchant, amountStr] = key.split('|||');
            const amount = parseFloat(amountStr);
            const lastDate = entries[entries.length - 1].date;
            const daysSince = Math.floor((Date.now() - new Date(lastDate)) / 86400000);
            const status = daysSince > 60 ? 'unused' : 'active';

            await Subscription.findOneAndUpdate(
                { user_id: userId, merchant, amount },
                { user_id: userId, merchant, amount, last_transaction_date: lastDate, days_since_last_use: daysSince, status, is_active: status !== 'cancelled' },
                { upsert: true, new: true }
            );

            await Transaction.updateMany(
                { user_id: userId, $or: [{ merchant }, { description: merchant }], amount },
                { is_recurring: true }
            );
        }
    }
}

// ── POST /api/transactions/upload ─────────────────────────────────────────────
router.post('/upload', async (req, res) => {
    try {
        const { transactions, user_id = 'default_user' } = req.body;

        if (!Array.isArray(transactions) || transactions.length === 0) {
            return res.status(400).json({ error: 'transactions array is required and must not be empty' });
        }

        // Validate & enrich each row
        const enriched = transactions.map(t => {
            const month = toMonth(t.date);
            if (!month) throw new Error(`Invalid date: ${t.date}`);
            return { ...t, month, merchant: t.description, user_id };
        });

        // Categorise all at once
        const categorised = await categoriseTransactions(enriched);

        // Upsert into MongoDB (avoid exact duplicates)
        const saved = [];
        for (const t of categorised) {
            const doc = await Transaction.findOneAndUpdate(
                { user_id: t.user_id, date: t.date, amount: t.amount, description: t.description },
                t,
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            saved.push(doc);
        }

        // Detect recurring payments after saving
        await detectRecurring(user_id);

        const month = categorised[0]?.month || '';

        res.json({
            success: true,
            count: saved.length,
            month,
            categorized: categorised.map(t => ({
                date: t.date,
                amount: t.amount,
                description: t.description,
                category: t.category,
            })),
        });
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/transactions?month=YYYY-MM ────────────────────────────────────
router.get('/', async (req, res) => {
    try {
        const { month, user_id = 'default_user' } = req.query;
        const filter = { user_id };
        if (month) filter.month = month;
        const transactions = await Transaction.find(filter).sort({ date: -1 });
        res.json({ transactions, count: transactions.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
