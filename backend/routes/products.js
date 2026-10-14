import {Router} from express;
import Product from ../models/Product.js;
const r = Router();

r.get(/, async (req, res) => {
    try {
        const q = { active: { $ne: false } };
        if (req.query.category && req.query.category !== all) {
            q.category = req.query.category.toLowerCase();
        }
        if (req.query.source && req.query.source !== all) {
            q.source = req.query.source.toLowerCase();
        }
        let data = await Product.find(q).sort({ createdAt: -1 });
        if (req.query.search && req.query.search.trim() !== ") {
 const s = req.query.search.toLowerCase().trim();
 data = data.filter(p =>
 (p.name && p.name.toLowerCase().includes(s)) ||
 (p.description && p.description.toLowerCase().includes(s)) ||
 (p.category && p.category.toLowerCase().includes(s)) ||
 (p.source && p.source.toLowerCase().includes(s))
 );
 }
 res.json(data);
 } catch (e) {
 res.status(500).json({ error: e.message });
 }
});

r.get(/:id, async (req, res) => {
 try {
 let p = null;
 if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
 p = await Product.findById(req.params.id);
 }
 if (!p) {
 p = await Product.findOne({ name: new RegExp(req.params.id, i) });
 }
 if (!p) return res.status(404).json({ message: Product not found });
 res.json(p);
 } catch (e) {
 res.status(500).json({ error: e.message });
 }
});

r.post(/, async (req, res) => {
 try {
 const p = await Product.create({ ...req.body, active: true });
 res.status(201).json(p);
 } catch (e) {
 res.status(500).json({ error: e.message });
 }
});

export default r;
