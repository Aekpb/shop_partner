import express, { Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import multer from 'multer';
import { createProxyMiddleware } from 'http-proxy-middleware';

// 📝 Load environment variables from absolute path
const envPath = path.join(__dirname, '.env');
dotenv.config({ path: envPath });

const app = express();
const PORT = process.env.PORT || 80;

// 🔐 ตรวจสอบค่าการเชื่อมต่อ Supabase
const supabaseUrl = (process.env.SUPABASE_URL || '').replace(/\s/g, ''); // ลบช่องว่างทั้งหมด
const supabaseKey = (process.env.SUPABASE_KEY || '').trim();

let supabase: any;

console.log('--------------------------------------------------');
console.log('🔍 กำลังตรวจสอบการตั้งค่า...');
console.log(`📍 SUPABASE_URL: ${supabaseUrl || 'ว่างเปล่า'}`);

if (!supabaseUrl || !supabaseKey) {
  console.error('⚠️ [ERROR] ข้อมูลการเชื่อมต่อ Supabase ไม่ครบถ้วนในไฟล์ .env');
} else {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ [SUCCESS] สร้าง Supabase Client สำเร็จ');
  } catch (err: any) {
    console.error('❌ [ERROR] ไม่สามารถสร้าง Supabase Client ได้:', err.message);
  }
}

const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(bodyParser.json());

// 🏢 Serve Admin Dashboard & Assets
app.use(express.static(path.join(__dirname, 'public'))); 
app.use('/assets', express.static(path.join(__dirname, 'assets'))); 

// 📸 API: Upload Image
app.post('/api/upload', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!supabase) throw new Error('Supabase not connected');
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const file = req.file;
    const filePath = `products/${Date.now()}.${file.originalname.split('.').pop()}`;
    const { error } = await supabase.storage.from('product-images').upload(filePath, file.buffer, { contentType: file.mimetype, upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(filePath);
    res.json({ success: true, url: publicUrl });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 🐉 API: Products
app.get('/api/products', async (req: Request, res: Response) => {
    if (!supabase) return res.json([]);
    const { data, error } = await supabase.from('products').select('*');
    res.json(error ? [] : data);
});
app.post('/api/products', async (req: Request, res: Response) => {
    if (!supabase) return res.status(500).json({ error: 'Supabase not connected' });
    const cleaned = (Array.isArray(req.body) ? req.body : [req.body]).map((p: any) => { 
      const { partnerId, ...rest } = p; 
      return { ...rest, partnerIds: p.partnerIds || (partnerId ? [partnerId] : []) }; 
    });
    const { error } = await supabase.from('products').upsert(cleaned, { onConflict: 'id' });
    res.json({ success: !error, error: error?.message });
});
app.delete('/api/products/:id', async (req: Request, res: Response) => {
    if (!supabase) return res.status(500).json({ error: 'Supabase not connected' });
    const { error } = await supabase.from('products').delete().eq('id', req.params.id);
    res.json({ success: !error });
});

// APIs (Partners, Categories, Orders)
app.get('/api/partners', async (req: Request, res: Response) => { if(!supabase) return res.json([]); const { data } = await supabase.from('partners').select('*'); res.json(data); });
app.post('/api/partners', async (req: Request, res: Response) => { if(!supabase) return res.status(500).json({error:'X'}); const { error } = await supabase.from('partners').upsert(req.body, { onConflict: 'id' }); res.json({ success: !error }); });
app.delete('/api/partners/:id', async (req: Request, res: Response) => { if(!supabase) return res.status(500).json({error:'X'}); const { error } = await supabase.from('partners').delete().eq('id', req.params.id); res.json({ success: !error }); });
app.get('/api/categories', async (req: Request, res: Response) => { if(!supabase) return res.json([]); const { data } = await supabase.from('categories').select('*'); res.json(data); });
app.post('/api/categories', async (req: Request, res: Response) => { if(!supabase) return res.status(500).json({error:'X'}); const { error } = await supabase.from('categories').upsert(req.body, { onConflict: 'id' }); res.json({ success: !error }); });
app.delete('/api/categories/:id', async (req: Request, res: Response) => { if(!supabase) return res.status(500).json({error:'X'}); const { error } = await supabase.from('categories').delete().eq('id', req.params.id); res.json({ success: !error }); });
app.get('/api/orders', async (req: Request, res: Response) => { if(!supabase) return res.json([]); const { data } = await supabase.from('orders').select('*').order('timestamp', { ascending: false }); res.json(data); });
app.post('/api/orders', async (req: Request, res: Response) => { if(!supabase) return res.status(500).json({error:'X'}); const { error } = await supabase.from('orders').insert([req.body]); res.json({ success: !error }); });
app.delete('/api/orders/:id', async (req: Request, res: Response) => { if(!supabase) return res.status(500).json({error:'X'}); const { error } = await supabase.from('orders').delete().eq('id', req.params.id); res.json({ success: !error }); });

app.post('/api/login', async (req: Request, res: Response) => {
    if (!supabase) return res.status(500).json({ error: 'Supabase not connected' });
    const { data, error } = await supabase.auth.signInWithPassword(req.body);
    if (error) return res.status(401).json({ error: error.message });
    res.json({ success: true, user: data.user });
});

// 🎯 Proxy to Frontend (Vite)
if (process.env.NODE_ENV !== 'production') {
  app.use('/', createProxyMiddleware({
    target: 'http://localhost:5173',
    changeOrigin: true,
    filter: (pathname) => !pathname.startsWith('/api') && !pathname.startsWith('/assets') && !pathname.includes('.')
  }));
}

// Fallback for Admin UI
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 🚀 Start Server
app.listen(PORT, async () => {
  console.log(`🐉 Backend running on http://localhost:${PORT}`);
  console.log(`👉 Admin Dashboard: http://localhost:${PORT}/admin`);
  console.log('--------------------------------------------------');
});
