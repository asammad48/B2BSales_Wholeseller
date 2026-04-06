import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";

// Mock users database
const users = [
  {
    id: "1",
    email: "owner@example.com",
    password: bcrypt.hashSync("password123", 10),
    role: "owner",
    name: "Owner User",
  },
  {
    id: "2",
    email: "admin@example.com",
    password: bcrypt.hashSync("password123", 10),
    role: "admin",
    name: "Admin User",
  },
  {
    id: "3",
    email: "staff@example.com",
    password: bcrypt.hashSync("password123", 10),
    role: "staff",
    name: "Staff User",
  },
  {
    id: "4",
    email: "client@example.com",
    password: bcrypt.hashSync("password123", 10),
    role: "client",
    name: "Client User",
  },
];

// Mock products database
let products = [
  {
    id: "1",
    name: "iPhone 15 Pro Max",
    brandId: "b1",
    brandName: "Mobia2Z",
    modelId: "m1",
    modelName: "iPhone 15 Pro Max",
    sku: "APP-IP15PM-256-GR",
    barcode: "194253700000",
    trackingType: "Serial",
    qualityType: "New",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Galaxy S24 Ultra",
    brandId: "b2",
    brandName: "Mobia2Z",
    modelId: "m2",
    modelName: "Galaxy S24 Ultra",
    sku: "SAM-S24U-512-TI",
    barcode: "880609500000",
    trackingType: "Serial",
    qualityType: "New",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Pixel 8 Pro",
    brandId: "b3",
    brandName: "Mobia2Z",
    modelId: "m3",
    modelName: "Pixel 8 Pro",
    sku: "GOO-P8P-128-OB",
    barcode: "840244600000",
    trackingType: "Serial",
    qualityType: "New",
    isActive: false,
    createdAt: new Date().toISOString(),
  },
];

// Mock inventory database
let inventory = [
  {
    id: "inv1",
    productId: "1",
    productName: "iPhone 15 Pro Max",
    sku: "APP-IP15PM-256-GR",
    barcode: "194253700000",
    brandName: "Mobia2Z",
    modelName: "iPhone 15 Pro Max",
    shopId: "s1",
    shopName: "Main Warehouse",
    quantityOnHand: 50,
    reservedQuantity: 5,
    trackingType: "Serial",
    lowStockThreshold: 10,
  },
  {
    id: "inv2",
    productId: "2",
    productName: "Galaxy S24 Ultra",
    sku: "SAM-S24U-512-TI",
    barcode: "880609500000",
    brandName: "Mobia2Z",
    modelName: "Galaxy S24 Ultra",
    shopId: "s1",
    shopName: "Main Warehouse",
    quantityOnHand: 30,
    reservedQuantity: 2,
    trackingType: "Serial",
    lowStockThreshold: 5,
  },
  {
    id: "inv3",
    productId: "1",
    productName: "iPhone 15 Pro Max",
    sku: "APP-IP15PM-256-GR",
    barcode: "194253700000",
    brandName: "Mobia2Z",
    modelName: "iPhone 15 Pro Max",
    shopId: "s2",
    shopName: "Downtown Store",
    quantityOnHand: 8,
    reservedQuantity: 0,
    trackingType: "Serial",
    lowStockThreshold: 10,
  }
];

// Mock orders database
let orders = [
  {
    id: "o1",
    orderNumber: "ORD-2024-001",
    clientId: "c1",
    clientName: "Tech Solutions Inc",
    shopId: "s1",
    shopName: "Main Warehouse",
    status: "Pending",
    totalAmount: 2500.00,
    createdAt: "2024-03-14T10:00:00Z",
    items: [
      { productId: "1", quantity: 2, price: 1250.00 }
    ]
  },
  {
    id: "o2",
    orderNumber: "ORD-2024-002",
    clientId: "c2",
    clientName: "Global Retailers",
    shopId: "s1",
    shopName: "Main Warehouse",
    status: "ReadyForPickup",
    totalAmount: 1800.00,
    createdAt: "2024-03-14T11:30:00Z",
    items: [
      { productId: "2", quantity: 2, price: 900.00 }
    ]
  }
];

// Mock transfers database
let transfers = [
  {
    id: "t1",
    fromShopId: "s1",
    fromShopName: "Main Warehouse",
    toShopId: "s2",
    toShopName: "Downtown Branch",
    status: "Pending",
    createdAt: "2024-03-14T09:00:00Z",
    items: [
      { productId: "1", productName: "iPhone 15 Pro", quantity: 5 }
    ]
  }
];

// Mock notifications database
let notifications = [
  {
    id: "n1",
    type: "LowStock",
    title: "Low Stock Alert",
    message: "iPhone 15 Pro is below threshold in Main Warehouse.",
    createdAt: "2024-03-14T08:00:00Z",
    isRead: false
  },
  {
    id: "n2",
    type: "System",
    title: "System Update",
    message: "Inventory sync completed successfully.",
    createdAt: "2024-03-14T07:00:00Z",
    isRead: true
  }
];

// Mock tenant settings
let tenantSettings = {
  id: "tenant1",
  name: "Mobia2Z",
  primaryColor: "#111827", // gray-900
  secondaryColor: "#4B5563", // gray-600
  accentColor: "#059669", // emerald-600
  currency: "USD",
  language: "en"
};

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5000;

  app.use(express.json());

  // Tenant API Routes
  app.get("/api/tenant/settings", (req, res) => {
    res.json(tenantSettings);
  });

  app.put("/api/tenant/settings", (req, res) => {
    tenantSettings = { ...tenantSettings, ...req.body };
    res.json(tenantSettings);
  });

  // Auth API Routes
  app.post("/api/login", (req, res) => {
    const { email, password } = req.body;
    const user = users.find((u) => u.email === email);

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name } });
  });

  app.get("/api/me", (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const user = users.find((u) => u.id === decoded.id);
      if (!user) return res.status(404).json({ message: "User not found" });

      res.json({ id: user.id, email: user.email, role: user.role, name: user.name });
    } catch (err) {
      res.status(401).json({ message: "Invalid token" });
    }
  });

  // Users API Routes
  app.get("/api/users", (req, res) => {
    const { search = "" } = req.query;
    let filtered = users.map(u => ({
      id: u.id,
      fullName: u.name,
      email: u.email,
      roleNames: [u.role],
      shopName: "Main Warehouse", // Mock
      isActive: true
    }));

    if (search) {
      const s = String(search).toLowerCase();
      filtered = filtered.filter(u => 
        u.fullName.toLowerCase().includes(s) ||
        u.email.toLowerCase().includes(s)
      );
    }

    res.json(filtered);
  });

  // Products API Routes
  app.get("/api/products", (req, res) => {
    const { page = 1, limit = 10, search = "", sortBy = "createdAt", sortDirection = "desc" } = req.query;
    
    let filteredProducts = [...products];

    if (search) {
      const s = String(search).toLowerCase();
      filteredProducts = filteredProducts.filter(p => 
        p.name.toLowerCase().includes(s) ||
        p.sku.toLowerCase().includes(s) ||
        p.barcode.toLowerCase().includes(s) ||
        p.brandName.toLowerCase().includes(s) ||
        p.modelName.toLowerCase().includes(s)
      );
    }

    // Sort
    filteredProducts.sort((a: any, b: any) => {
      const valA = a[String(sortBy)];
      const valB = b[String(sortBy)];
      if (sortDirection === "asc") {
        return valA > valB ? 1 : -1;
      } else {
        return valA < valB ? 1 : -1;
      }
    });

    // Paginate
    const start = (Number(page) - 1) * Number(limit);
    const end = start + Number(limit);
    const paginated = filteredProducts.slice(start, end);

    res.json({
      data: paginated,
      total: filteredProducts.length,
      page: Number(page),
      limit: Number(limit)
    });
  });

  app.get("/api/products/:id", (req, res) => {
    const product = products.find(p => p.id === req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  });

  app.post("/api/products", (req, res) => {
    const newProduct = {
      ...req.body,
      id: String(products.length + 1),
      createdAt: new Date().toISOString(),
      isActive: req.body.isActive ?? true
    };
    products.push(newProduct);
    res.status(201).json(newProduct);
  });

  // Inventory API Routes
  app.get("/api/inventory", (req, res) => {
    const { page = 1, limit = 10, search = "" } = req.query;
    
    let filtered = [...inventory];

    if (search) {
      const s = String(search).toLowerCase();
      filtered = filtered.filter(i => 
        i.productName.toLowerCase().includes(s) ||
        i.sku.toLowerCase().includes(s) ||
        i.barcode.toLowerCase().includes(s) ||
        i.brandName.toLowerCase().includes(s) ||
        i.modelName.toLowerCase().includes(s) ||
        i.shopName.toLowerCase().includes(s)
      );
    }

    const start = (Number(page) - 1) * Number(limit);
    const end = start + Number(limit);
    const paginated = filtered.slice(start, end);

    res.json({
      data: paginated,
      total: filtered.length,
      page: Number(page),
      limit: Number(limit)
    });
  });

  app.post("/api/inventory/stock-in", (req, res) => {
    const { productId, shopId, quantity, trackingType } = req.body;
    
    let item = inventory.find(i => i.productId === productId && i.shopId === shopId);
    
    if (item) {
      item.quantityOnHand += Number(quantity);
    } else {
      // In a real app we'd fetch product/shop details
      const product = products.find(p => p.id === productId);
      if (!product) return res.status(404).json({ message: "Product not found" });
      
      item = {
        id: `inv${inventory.length + 1}`,
        productId,
        productName: product.name,
        sku: product.sku,
        barcode: product.barcode,
        brandName: product.brandName,
        modelName: product.modelName,
        shopId,
        shopName: "New Shop Location", // Mock
        quantityOnHand: Number(quantity),
        reservedQuantity: 0,
        trackingType: trackingType || product.trackingType,
        lowStockThreshold: 10
      };
      inventory.push(item);
    }
    
    res.json(item);
  });

  app.post("/api/inventory/adjust", (req, res) => {
    const { id, adjustment, reason } = req.body;
    const item = inventory.find(i => i.id === id);
    
    if (!item) return res.status(404).json({ message: "Inventory item not found" });
    
    item.quantityOnHand += Number(adjustment);
    res.json(item);
  });

  // Orders API Routes
  app.get("/api/orders", (req, res) => {
    const { page = 1, limit = 10, search = "" } = req.query;
    
    let filtered = [...orders];

    if (search) {
      const s = String(search).toLowerCase();
      filtered = filtered.filter(o => 
        o.orderNumber.toLowerCase().includes(s) ||
        o.clientName.toLowerCase().includes(s) ||
        o.shopName.toLowerCase().includes(s)
      );
    }

    const start = (Number(page) - 1) * Number(limit);
    const end = start + Number(limit);
    const paginated = filtered.slice(start, end);

    res.json({
      data: paginated,
      total: filtered.length,
      page: Number(page),
      limit: Number(limit)
    });
  });

  app.post("/api/orders/:id/ready", (req, res) => {
    const order = orders.find(o => o.id === req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    order.status = "ReadyForPickup";
    res.json(order);
  });

  app.post("/api/orders/:id/complete", (req, res) => {
    const order = orders.find(o => o.id === req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    
    // Trigger stock deduction
    for (const item of order.items) {
      const invItem = inventory.find(i => i.productId === item.productId && i.shopId === order.shopId);
      if (invItem) {
        invItem.quantityOnHand -= item.quantity;
      }
    }

    order.status = "Completed";
    res.json(order);
  });

  app.post("/api/orders/:id/unable-to-fulfill", (req, res) => {
    const order = orders.find(o => o.id === req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    
    order.status = "UnableToFulfill";
    res.json(order);
  });

  // Transfers API Routes
  app.get("/api/transfers", (req, res) => {
    res.json(transfers);
  });

  app.post("/api/transfers", (req, res) => {
    const newTransfer = {
      ...req.body,
      id: `t${transfers.length + 1}`,
      status: "Pending",
      createdAt: new Date().toISOString(),
      fromShopName: "Source Shop", // Mock
      toShopName: "Destination Shop" // Mock
    };
    transfers.push(newTransfer);
    res.status(201).json(newTransfer);
  });

  app.post("/api/transfers/:id/dispatch", (req, res) => {
    const transfer = transfers.find(t => t.id === req.params.id);
    if (!transfer) return res.status(404).json({ message: "Transfer not found" });
    transfer.status = "Dispatched";
    res.json(transfer);
  });

  app.post("/api/transfers/:id/receive", (req, res) => {
    const transfer = transfers.find(t => t.id === req.params.id);
    if (!transfer) return res.status(404).json({ message: "Transfer not found" });
    transfer.status = "Received";
    res.json(transfer);
  });

  // Notifications API Routes
  app.get("/api/notifications", (req, res) => {
    res.json(notifications);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
