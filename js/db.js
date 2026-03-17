/**
 * db.js — Simulated SQL Server database using localStorage
 * Mimics SQL table operations: INSERT, SELECT, UPDATE, DELETE
 */

const DB = {
  _tables: {},

  // Initialize tables
  init() {
    const saved = localStorage.getItem('pedragelada_db');
    if (saved) {
      this._tables = JSON.parse(saved);
    } else {
      this._tables = {
        products: [],
        orders: [],
        order_items: [],
        ratings: [],
        payments: []
      };
      this._seed();
    }
  },

  // Seed initial product data
  _seed() {
    const products = [
      {
        id: 1,
        name: 'Sorvete de Chocolate',
        description: 'Intenso e cremoso, feito com chocolate belga 70% cacau. Uma experiência inesquecível.',
        price: 12.90,
        emoji: '🍫',
        color: '#7C3AED',
        bg: 'linear-gradient(135deg,#DDD6FE,#C4B5FD)',
        img: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&q=80',
        category: 'tradicional',
        available: true
      },
      {
        id: 2,
        name: 'Sorvete de Creme',
        description: 'Suave e aveludado, elaborado com creme de leite fresco e baunilha natural da Madagáscar.',
        price: 10.90,
        emoji: '🍨',
        color: '#D97706',
        bg: 'linear-gradient(135deg,#FEF3C7,#FDE68A)',
        img: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&q=80',
        category: 'tradicional',
        available: true
      },
      {
        id: 3,
        name: 'Sorvete de Baunilha',
        description: 'Clássico e irresistível. Extrato puro de baunilha com textura perfeitamente cremosa.',
        price: 10.90,
        emoji: '🌿',
        color: '#059669',
        bg: 'linear-gradient(135deg,#D1FAE5,#A7F3D0)',
        img: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400&q=80',
        category: 'tradicional',
        available: true
      },
      {
        id: 4,
        name: 'Sorvete de Morango',
        description: 'Feito com morangos frescos selecionados. Sabor vibrante e refrescante em cada colherada.',
        price: 11.90,
        emoji: '🍓',
        color: '#E11D48',
        bg: 'linear-gradient(135deg,#FFE4E6,#FECDD3)',
        img: 'https://images.unsplash.com/photo-1488900128323-21503983a07e?w=400&q=80',
        category: 'tradicional',
        available: true
      },
      {
        id: 5,
        name: 'Casquinha Tripla',
        description: 'Escolha 3 sabores na mesma casquinha crocante. A combinação perfeita é sua!',
        price: 18.90,
        emoji: '🍦',
        color: '#DB2777',
        bg: 'linear-gradient(135deg,#FCE7F3,#FBCFE8)',
        img: 'https://images.unsplash.com/photo-1580915411954-282cb1b0d780?w=400&q=80',
        category: 'especial',
        available: true
      },
      {
        id: 6,
        name: 'Sundae Premium',
        description: 'Sorvete coberto com calda quente de chocolate, chantilly, nozes e cereja.',
        price: 22.90,
        emoji: '🍒',
        color: '#9333EA',
        bg: 'linear-gradient(135deg,#F3E8FF,#DDD6FE)',
        img: 'https://images.unsplash.com/photo-1567206563064-6f60f40a2b57?w=400&q=80',
        category: 'especial',
        available: true
      },
      {
        id: 7,
        name: 'Milk Shake de Chocolate',
        description: 'Espesso e cremoso milk shake de chocolate com cobertura de chantilly.',
        price: 19.90,
        emoji: '🥤',
        color: '#7C3AED',
        bg: 'linear-gradient(135deg,#EDE9FE,#C4B5FD)',
        img: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=400&q=80',
        category: 'bebidas',
        available: true
      },
      {
        id: 8,
        name: 'Açaí Especial',
        description: 'Açaí puro da Amazônia com granola crocante, banana, mel e leite condensado.',
        price: 16.90,
        emoji: '🫐',
        color: '#4F46E5',
        bg: 'linear-gradient(135deg,#E0E7FF,#C7D2FE)',
        img: 'https://images.unsplash.com/photo-1590736704728-f4730bb30770?w=400&q=80',
        category: 'especial',
        available: true
      }
    ];
    products.forEach(p => this.insert('products', p));

    // Seed some sample orders for demo
    const sampleOrders = [
      { id: this._genId(), customer_name: 'Ana Lima', customer_phone: '(11) 98765-4321', status: 'preparing', total: 23.80, payment_method: 'pix', created_at: new Date(Date.now() - 600000).toISOString() },
      { id: this._genId(), customer_name: 'Carlos Mendes', customer_phone: '(11) 91234-5678', status: 'pending', total: 18.90, payment_method: 'credit', created_at: new Date(Date.now() - 120000).toISOString() },
    ];
    const sampleItems = [
      { order_id: sampleOrders[0].id, product_id: 1, product_name: 'Sorvete de Chocolate', qty: 1, unit_price: 12.90 },
      { order_id: sampleOrders[0].id, product_id: 4, product_name: 'Sorvete de Morango', qty: 1, unit_price: 10.90 },
      { order_id: sampleOrders[1].id, product_id: 5, product_name: 'Casquinha Tripla', qty: 1, unit_price: 18.90 },
    ];
    sampleOrders.forEach(o => this.insert('orders', o));
    sampleItems.forEach(i => this.insert('order_items', i));

    // Seed sample ratings
    const sampleRatings = [
      { id: this._genId(), name: 'Juliana Costa', rating: 5, comment: 'Melhor sorvete que já comi! O de chocolate é incrível.', created_at: new Date().toISOString() },
      { id: this._genId(), name: 'Roberto Alves', rating: 4, comment: 'Muito gostoso e atendimento excelente. Recomendo!', created_at: new Date().toISOString() },
      { id: this._genId(), name: 'Fernanda M.', rating: 5, comment: 'O sundae premium é uma obra de arte. Voltarei sempre!', created_at: new Date().toISOString() },
    ];
    sampleRatings.forEach(r => this.insert('ratings', r));
    this._persist();
  },

  _genId() {
    return 'PG' + Math.random().toString(36).substr(2, 6).toUpperCase();
  },

  _persist() {
    localStorage.setItem('pedragelada_db', JSON.stringify(this._tables));
  },

  // SQL: INSERT INTO table VALUES(record)
  insert(table, record) {
    if (!this._tables[table]) this._tables[table] = [];
    this._tables[table].push(record);
    this._persist();
    return record;
  },

  // SQL: SELECT * FROM table WHERE condition
  select(table, condition = null) {
    const rows = this._tables[table] || [];
    if (!condition) return [...rows];
    return rows.filter(condition);
  },

  // SQL: SELECT * FROM table WHERE id = ?
  findById(table, id) {
    const rows = this._tables[table] || [];
    return rows.find(r => r.id === id) || null;
  },

  // SQL: UPDATE table SET fields WHERE id = ?
  update(table, id, fields) {
    const rows = this._tables[table] || [];
    const idx = rows.findIndex(r => r.id === id);
    if (idx === -1) return null;
    this._tables[table][idx] = { ...rows[idx], ...fields };
    this._persist();
    return this._tables[table][idx];
  },

  // SQL: DELETE FROM table WHERE id = ?
  delete(table, id) {
    const rows = this._tables[table] || [];
    this._tables[table] = rows.filter(r => r.id !== id);
    this._persist();
  },

  // SQL: SELECT COUNT(*) FROM table WHERE condition
  count(table, condition = null) {
    return this.select(table, condition).length;
  },

  // SQL: SELECT SUM(field) FROM table WHERE condition
  sum(table, field, condition = null) {
    return this.select(table, condition).reduce((acc, r) => acc + (r[field] || 0), 0);
  },

  // Generate a new unique order ID
  newOrderId() {
    return 'PG' + Date.now().toString(36).toUpperCase().substr(-4) +
           Math.random().toString(36).substr(2, 3).toUpperCase();
  }
};

// Initialize DB on load
DB.init();
