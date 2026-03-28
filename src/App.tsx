import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useParams, Navigate, Link } from 'react-router-dom'
import './App.css'
import { supabase } from './supabaseClient'

interface Partner {
  id: string;
  name: string;
  thaiName: string;
  logo: string;
}

interface Product {
  id: number;
  partnerIds: string[];
  name: string;
  price: number;
  emoji: string;
  category: string;
  imageUrl?: string;
}

interface CartItem extends Product {
  quantity: number;
  sweetness: string;
}

function StorePage({ allPartners }: { allPartners: Partner[] }) {
  const { partnerId } = useParams<{ partnerId: string }>();
  
  // 🔍 ค้นหาพาร์ทเนอร์จริงจากฐานข้อมูลเท่านั้น ไม่มีการ make ข้อมูล
  const partner = allPartners.find(p => p.id === partnerId);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSweetness, setSelectedSweetness] = useState<{[key: number]: string}>({});
  const [toast, setToast] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [cartAnim, setCartAnim] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkMobile = () => {
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isMobileUA || window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    async function fetchData() {
      if (!partnerId) return;
      setLoading(true);
      
      try {
        // 1. ดึงหมวดหมู่จริงจากตาราง categories
        const { data: catData } = await supabase.from('categories').select('name');
        if (catData) setCategories(['All', ...catData.map(c => c.name)]);

        // 2. ดึงสินค้าจริงที่มี partnerId นี้ในฐานข้อมูล
        const { data: prodData } = await supabase
          .from('products')
          .select('*')
          .contains('partnerIds', [partnerId])
          .order('id', { ascending: true });

        if (prodData) {
          setProducts(prodData);
          setSelectedSweetness(prodData.reduce((acc: any, p: any) => ({...acc, [p.id]: '100%'}), {}));
        }
      } catch (e) {
        console.error("Database Error:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [partnerId]);

  // หากยังไม่มีพาร์ทเนอร์ในระบบ ให้แสดงหน้าว่างเพื่อรอข้อมูลจริง
  if (!partner && !loading) {
    return <div className="loading-screen">ไม่พบข้อมูลร้านค้าในฐานข้อมูล Supabase</div>;
  }

  if (loading) {
    return <div className="loading-screen">กำลังดึงข้อมูลจาก Supabase... 🐉</div>;
  }

  const addToCart = (product: Product) => {
    const sweetness = selectedSweetness[product.id] || '100%';
    setCart(prev => {
      const exist = prev.find(i => i.id === product.id && i.sweetness === sweetness);
      if (exist) return prev.map(i => i === exist ? {...i, quantity: i.quantity + 1} : i);
      return [...prev, { ...product, quantity: 1, sweetness }];
    });
    setCartAnim(true);
    setTimeout(() => setCartAnim(false), 300);
    setToast(`เพิ่ม ${product.name} แล้ว!`);
    setTimeout(() => setToast(null), 2000);
  };

  const updateQuantity = (id: number, sweetness: string, delta: number) => {
    setCart(prev => prev.map(item =>
      item.id === id && item.sweetness === sweetness ? { ...item, quantity: item.quantity + delta } : item
    ).filter(item => item.quantity > 0));
  };

  const cartTotal = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
  const filteredProducts = selectedCategory === 'All' ? products : products.filter(p => p.category === selectedCategory);

  return (
    <div className={`app ${isMobile ? 'mobile-view' : 'desktop-view'}`}>
      {toast && <div className="toast">{toast}</div>}

      <nav className="navbar">
        <div className="brand-title">
          <span style={{fontSize: '1.8rem'}}>{partner?.logo}</span>
          <div className="brand-text">{partner?.name}</div>
        </div>
        <button className={`cart-trigger ${cartAnim ? 'cart-bump' : ''}`} onClick={() => setIsCartOpen(true)}>
          <span className="cart-total-badge">฿{cartTotal}</span>
          <div className="cart-count">{cart.reduce((a, b) => a + b.quantity, 0)}</div>
        </button>
      </nav>

      <header className="hero">
        <div className="hero-badge">{partner?.name} Official</div>
        <h1>{(partner?.thaiName || '').split(' ')[0]} <span>{(partner?.thaiName || '').split(' ')[1] || ''}</span></h1>
        <p>ข้อมูลทั้งหมดถูกดึงสดจาก Supabase ของคุณ</p>
      </header>

      <div className="filter-bar">
        {categories.map(cat => (
          <button key={cat} className={`filter-chip ${selectedCategory === cat ? 'active' : ''}`} onClick={() => setSelectedCategory(cat)}>{cat}</button>
        ))}
      </div>

      <main className="product-grid">
        {filteredProducts.length === 0 ? (
          <div style={{gridColumn:'1/-1', textAlign:'center', padding:'100px', color:'#64748b'}}>ไม่มีรายการสินค้าในฐานข้อมูล</div>
        ) : filteredProducts.map((product) => (
          <div key={product.id} className="product-card">
            <div className="product-tag">{product.category}</div>
            <div className="img-wrapper">
              {product.imageUrl ? <img src={product.imageUrl} alt={product.name} /> : <span style={{fontSize: '4rem'}}>{product.emoji}</span>}
            </div>
            <div className="product-info">
              <div className="product-title">{product.name}</div>
              <div className="sweetness-options">
                {['0%', '50%', '100%'].map(level => (
                  <button key={level} className={`sweet-btn ${selectedSweetness[product.id] === level ? 'active' : ''}`} onClick={() => setSelectedSweetness(prev => ({...prev, [product.id]: level}))}>{level}</button>
                ))}
              </div>
              <div className="price-container">
                <span className="amount">฿{product.price}</span>
                <button className="add-button" onClick={() => addToCart(product)}>+</button>
              </div>
            </div>
          </div>
        ))}
      </main>

      {isCartOpen && (
        <div className="cart-overlay" onClick={() => setIsCartOpen(false)}>
          <div className="cart-drawer" onClick={e => e.stopPropagation()}>
            <div className="cart-header">
              <h2>ตะกร้าสินค้า</h2>
              <button className="close-cart" onClick={() => setIsCartOpen(false)}></button>
            </div>
            <div className="cart-content">
              {cart.length === 0 ? <div style={{textAlign:'center', marginTop:'50px'}}>ว่างเปล่า</div> : cart.map(item => (
                <div key={`${item.id}-${item.sweetness}`} className="cart-item">
                  <div className="cart-item-img">
                    {item.imageUrl ? <img src={item.imageUrl} alt={item.name} /> : <span>{item.emoji}</span>}
                  </div>
                  <div className="item-details">
                    <div className="item-name">{item.name}</div>
                    <div className="item-meta">ความหวาน: {item.sweetness}</div>
                    <div className="item-bottom">
                      <div className="item-price">฿{item.price * item.quantity}</div>
                      <div className="qty-control">
                        <button onClick={() => updateQuantity(item.id, item.sweetness, -1)}>−</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.sweetness, 1)}>+</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div className="cart-footer">
                <div className="cart-summary-block">
                  <div className="summary-info">
                    <span>ยอดชำระทั้งหมด</span>
                    <span className="summary-value">฿{cartTotal}</span>
                  </div>
                  <button className="checkout-button">ยืนยันรายการ</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div style={{padding: '40px 20px', textAlign: 'center', opacity: 0.3}}>
        <div style={{display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap'}}>
           {allPartners.map(p => (
             <Link key={p.id} to={`/store/${p.id}`} style={{fontSize: '0.6rem', color: '#64748b', textDecoration: 'none'}}>• DB: {p.id}</Link>
           ))}
        </div>
      </div>
    </div>
  );
}

function App() {
  const [allPartners, setAllPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPartners() {
      try {
        const { data } = await supabase.from('partners').select('*');
        if (data && data.length > 0) {
          setAllPartners(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchPartners();
  }, []);

  if (loading) return <div className="loading-screen">กำลังเตรียมข้อมูลจากฐานข้อมูล... 🐉</div>;

  return (
    <BrowserRouter>
      <Routes>
        {allPartners.length > 0 ? (
          <>
            <Route path="/store/:partnerId" element={<StorePage allPartners={allPartners} />} />
            <Route path="/" element={<Navigate to={`/store/${allPartners[0].id}`} replace />} />
          </>
        ) : (
          <Route path="*" element={<div className="loading-screen">กรุณาเพิ่มข้อมูลพาร์ทเนอร์ใน Supabase ตาราง 'partners' เพื่อเริ่มต้น</div>} />
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App
