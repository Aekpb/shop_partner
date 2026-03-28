export const products = [
  // Partner 1: Original Dragonz Cha
  { "id": 1, "partnerId": "dragonz", "name": "ชานมมังกรพ่นไฟ", "price": 45, "emoji": "🧋", "category": "โคตรชานม" },
  { "id": 2, "partnerId": "dragonz", "name": "ชานมไต้หวันต้นตำรับ", "price": 50, "emoji": "🧋", "category": "โคตรชานม" },
  { "id": 3, "partnerId": "dragonz", "name": "นมสดลาวาพ่นไฟ", "price": 60, "emoji": "🥛", "category": "โคตรนม" },
  { "id": 4, "partnerId": "dragonz", "name": "โกโก้มังกรเข้มข้น", "price": 55, "emoji": "🍫", "category": "โคตรนม" },
  
  // Partner 2: Golden Leaf (Greener Theme)
  { "id": 101, "partnerId": "goldenleaf", "name": "ชาเขียวมัทฉะลาเต้", "price": 65, "emoji": "🌿", "category": "ชาพรีเมียม" },
  { "id": 102, "partnerId": "goldenleaf", "name": "ชาอูหลงยอดน้ำค้าง", "price": 70, "emoji": "🍃", "category": "ชาพรีเมียม" },
  { "id": 103, "partnerId": "goldenleaf", "name": "ชาไทยหอมหมื่นลี้", "price": 55, "emoji": "🍵", "category": "ชาไทย" },
  
  // Common items (maybe available everywhere)
  { "id": 9, "partnerId": "dragonz", "name": "ชามะนาวใส", "price": 40, "emoji": "🍋", "category": "โคตรใส" },
  { "id": 10, "partnerId": "dragonz", "name": "ชามะลิใส", "price": 40, "emoji": "🌼", "category": "โคตรใส" }
];

export const partners = [
  {
    id: "dragonz",
    name: "DRAGONZ CHA",
    thaiName: "โคตรชา โคตรมังกร",
    logo: "🐉",
    colors: {
      primary: "#d63031",
      secondary: "#8e0000",
      gradient: "linear-gradient(135deg, #d63031 0%, #8e0000 100%)",
      accent: "#f1c40f"
    }
  },
  {
    id: "goldenleaf",
    name: "GOLDEN LEAF",
    thaiName: "ใบชาทองคำ",
    logo: "🍃",
    colors: {
      primary: "#27ae60",
      secondary: "#145a32",
      gradient: "linear-gradient(135deg, #27ae60 0%, #145a32 100%)",
      accent: "#f39c12"
    }
  }
];
