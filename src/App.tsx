import { useEffect, useMemo, useRef, useState } from "react";
import {
  type ApiProduct,
  type Customer,
  type IVROrder,
  type MLForecastItem,
  type MLReorderItem,
  type PurchaseOrder,
  type SaleOrder,
  type StoreStats,
  type Supplier,
  type User,
  clearSession,
  confirmIVROrder,
  createCustomer,
  createProduct,
  createPurchaseOrder,
  createSale,
  createSupplier,
  fetchCurrentUser,
  getCustomers,
  getCustomerTransactions,
  getIVROrders,
  getMLForecast,
  getMLReorderRecommendations,
  getOrders,
  getProductByBarcode,
  getProductCategories,
  getProducts,
  getPurchaseOrders,
  getStoreStats,
  getSuppliers,
  getStoredUser,
  loginUser,
  recordUdhaarPayment,
  registerUser,
  restockProduct,
  simulateIVRCall,
  STORE_IVR_NUMBER,
  STORE_IVR_DISPLAY,
  updateOrderStatus,
  updatePurchaseOrderStatus,
} from "./api";

type IconName =
  | "grid" | "bill" | "box" | "users" | "wallet" | "truck" | "orders"
  | "phone" | "chart" | "search" | "bell" | "plus" | "arrow" | "chevron"
  | "spark" | "scan" | "sync" | "store" | "check" | "minus" | "mobile"
  | "globe" | "clock" | "warning" | "download" | "headset" | "logout" | "filter";

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></>,
    bill: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" /><path d="M9 8h6M9 12h6" /></>,
    box: <><path d="m4 7 8-4 8 4-8 4-8-4Z" /><path d="M4 7v10l8 4 8-4V7M12 11v10" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></>,
    wallet: <><path d="M3 6h16v14H3a2 2 0 0 1-2-2V6a3 3 0 0 1 3-3h14v3" /><path d="M15 11h7v5h-7a2.5 2.5 0 0 1 0-5Z" /></>,
    truck: <><path d="M3 5h11v12H3zM14 9h4l3 3v5h-7z" /><circle cx="7" cy="19" r="2" /><circle cx="18" cy="19" r="2" /></>,
    orders: <><path d="M6 2h12l2 5H4l2-5ZM5 7v14h14V7" /><path d="M9 11h6" /></>,
    phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.4 1.8.6 2.8.7a2 2 0 0 1 1.7 2.1Z" />,
    chart: <><path d="M3 3v18h18" /><path d="m7 15 4-4 3 3 6-7" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    minus: <path d="M5 12h14" />,
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    spark: <><path d="m12 3 1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Z" /><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" /></>,
    scan: <><path d="M3 7V4a1 1 0 0 1 1-1h3M17 3h3a1 1 0 0 1 1 1v3M21 17v3a1 1 0 0 1-1 1h-3M7 21H4a1 1 0 0 1-1-1v-3M7 12h10" /></>,
    sync: <><path d="M20 7h-5V2" /><path d="M20 7a8 8 0 1 0 1 8" /></>,
    store: <><path d="M3 9h18l-2-6H5L3 9Z" /><path d="M5 9v12h14V9M9 21v-7h6v7" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    mobile: <><rect x="6" y="2" width="12" height="20" rx="2" /><path d="M10 18h4" /></>,
    globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    warning: <><path d="M10.3 3.7 2.2 18a2 2 0 0 0 1.8 3h16a2 2 0 0 0 1.8-3L13.7 3.7a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></>,
    download: <><path d="M12 3v12m-5-5 5 5 5-5" /><path d="M5 21h14" /></>,
    headset: <><path d="M4 14v-2a8 8 0 0 1 16 0v2" /><path d="M18 19c0 2-2 2-4 2M4 14h3v5H5a1 1 0 0 1-1-1v-4ZM20 14h-3v5h2a1 1 0 0 0 1-1v-4Z" /></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></>,
    filter: <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />,
  };
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

const rupee = (n: number | string) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const navItems: { id: string; label: string; icon: IconName }[] = [
  { id: "dashboard", label: "Overview", icon: "grid" },
  { id: "billing", label: "Billing / POS", icon: "bill" },
  { id: "inventory", label: "Inventory", icon: "box" },
  { id: "customers", label: "Customers", icon: "users" },
  { id: "udhaar", label: "Udhaar / Khata", icon: "wallet" },
  { id: "suppliers", label: "Suppliers", icon: "truck" },
  { id: "orders", label: "Orders Desk", icon: "orders" },
  { id: "ivr", label: "IVR Orders", icon: "phone" },
  { id: "analytics", label: "AI & Analytics", icon: "chart" },
  { id: "mobile", label: "Mobile App", icon: "mobile" },
];

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="logo">
      <span className="logo-mark"><Icon name="store" size={21} /></span>
      {!compact && <span>Kirana<span className="logo-accent">One</span></span>}
    </div>
  );
}

function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "brand";
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function ProductThumb({ name = "", color = "#E4F0FF", small = false }: { name?: string; color?: string; small?: boolean }) {
  const short = name
    ? name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : "PR";
  return (
    <span className={`product-thumb ${small ? "small" : ""}`} style={{ backgroundColor: color }}>
      {short}
    </span>
  );
}

function playBarcodeBeep() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1850, ctx.currentTime);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch {
    // Ignore audio permission errors
  }
}

function BarcodeSVG({
  code = "8901262000001",
  width = 140,
  height = 46,
}: {
  code?: string;
  width?: number;
  height?: number;
}) {
  const bars: { x: number; w: number }[] = [];
  let curX = 6;
  for (let i = 0; i < code.length; i++) {
    const charCode = code.charCodeAt(i);
    const w1 = (charCode % 3) + 1;
    const gap = ((charCode >> 1) % 2) + 1;
    bars.push({ x: curX, w: w1 });
    curX += w1 + gap;
    const w2 = ((charCode >> 2) % 3) + 1;
    bars.push({ x: curX, w: w2 });
    curX += w2 + 1;
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${curX + 6} 50`}
      className="barcode-svg"
      style={{ display: "block", margin: "4px auto" }}
    >
      <rect width="100%" height="100%" fill="white" />
      {bars.map((b, idx) => (
        <rect key={idx} x={b.x} y={2} width={b.w} height={36} fill="#111" />
      ))}
      <text
        x={(curX + 6) / 2}
        y={46}
        textAnchor="middle"
        fontSize="8"
        fontFamily="monospace"
        fontWeight="bold"
        fill="#222"
      >
        {code}
      </text>
    </svg>
  );
}

function BarcodeScannerModal({
  isOpen,
  onClose,
  onScan,
  products = [],
}: {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
  products: ApiProduct[];
}) {
  const [manualCode, setManualCode] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [camError, setCamError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    if (isOpen) {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ video: { facingMode: "environment" } })
          .then((s) => {
            stream = s;
            setCameraActive(true);
            if (videoRef.current) {
              videoRef.current.srcObject = s;
              videoRef.current.play().catch(() => {});
            }
          })
          .catch(() => {
            setCamError("Camera not available. You can use manual entry or click test barcodes below.");
          });
      }
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!manualCode.trim()) return;
    onScan(manualCode.trim());
    setManualCode("");
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal modal-lg" onMouseDown={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <Badge tone="brand">BARCODE SYSTEM</Badge>
        <h2>Scan Product Barcode</h2>
        <p>Use your device camera, USB laser gun, or select an item below.</p>

        <div className="barcode-gun-hint">
          <Icon name="scan" size={16} />
          <span>
            <strong>Hardware USB / Bluetooth Gun Ready:</strong> Point scanner at any item anytime on POS screen.
          </span>
        </div>

        <div className="scanner-viewport">
          {cameraActive ? (
            <video ref={videoRef} className="scanner-video" playsInline muted />
          ) : (
            <div style={{ color: "#aaa", fontSize: 11, textAlign: "center", padding: 20 }}>
              <Icon name="scan" size={36} />
              <p style={{ marginTop: 8, color: "#888" }}>
                {camError || "Camera scanner active"}
              </p>
            </div>
          )}
          <div className="scanner-laser" />
          <div className="scanner-frame" />
          <div className="scanner-corners" />
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <input
            style={{ flex: 1, height: 42, border: "1px solid var(--line)", borderRadius: 9, padding: "0 12px", fontSize: 12 }}
            placeholder="Type or paste barcode (e.g. 8901262000001)..."
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            autoFocus
          />
          <button className="primary-btn" type="submit">
            <Icon name="check" size={14} /> Scan
          </button>
        </form>

        <div style={{ marginTop: 16 }}>
          <small style={{ fontSize: 10, fontWeight: 700, color: "#777", letterSpacing: 0.5, display: "block", marginBottom: 8 }}>
            ONE-CLICK QUICK TEST BARCODES (CLICK TO TEST INSTANT BEEP & CART ADD)
          </small>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, maxHeight: 150, overflowY: "auto" }}>
            {products.slice(0, 8).map((p) => {
              const code = p.barcode || `8901262${String(p.id).padStart(6, "0")}`;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onScan(code)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "7px 10px",
                    background: "#f8f8fc",
                    border: "1px solid var(--line)",
                    borderRadius: 8,
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  <div>
                    <strong style={{ fontSize: 10, display: "block" }}>{p.name}</strong>
                    <small style={{ fontSize: 9, color: "#888", fontFamily: "monospace" }}>{code}</small>
                  </div>
                  <Badge tone="brand">Scan</Badge>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function BarcodeLabelsModal({
  isOpen,
  onClose,
  products,
  storeName,
}: {
  isOpen: boolean;
  onClose: () => void;
  products: ApiProduct[];
  storeName: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal modal-lg" style={{ maxHeight: "90vh", display: "flex", flexDirection: "column" }} onMouseDown={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
          <div>
            <Badge tone="brand">THERMAL STICKER LABELS</Badge>
            <h2>Print Barcode Stickers (50x25mm)</h2>
            <p>Formatted for TVS, Zebra, Citizen & Pegasus barcode label printers.</p>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div style={{ display: "flex", gap: 10, margin: "14px 0" }}>
          <button className="primary-btn" onClick={() => window.print()}>
            <Icon name="download" /> Print Stickers (Ctrl + P)
          </button>
        </div>

        <div style={{ overflowY: "auto", flex: 1, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, padding: 8, background: "#f8f8fc", borderRadius: 12 }}>
          {products.map((p) => {
            const code = p.barcode || `8901262${String(p.id).padStart(6, "0")}`;
            return (
              <div key={p.id} className="barcode-label">
                <small style={{ fontSize: 8, letterSpacing: 0.5, color: "#777", textTransform: "uppercase" }}>{storeName || "Your Store"}</small>
                <strong title={p.name}>{p.name}</strong>
                <BarcodeSVG code={code} width={135} height={42} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, fontWeight: 700, marginTop: 2 }}>
                  <span>MRP: {rupee(p.price)}</span>
                  <span>SK-{1020 + p.id}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// AUTH MODAL COMPONENT (Login & Register)
// ==========================================
function AuthModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form state
  const [name, setName] = useState("");
  const [storeName, setStoreName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");

  if (!isOpen) return null;

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await loginUser(loginEmail, loginPassword);
      onSuccess(res.user);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to sign in.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await registerUser({
        name,
        store_name: storeName,
        email: regEmail,
        password: regPassword,
        phone,
      });
      onSuccess(res.user);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to register.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-overlay" onMouseDown={onClose}>
      <div className="auth-box" onMouseDown={(e) => e.stopPropagation()}>
        <div className="auth-header">
          <Badge tone="brand">SECURE PORTAL</Badge>
          <h2>{tab === "login" ? "Welcome Back to KiranaOne" : "Register Your Kirana Store"}</h2>
          <p>{tab === "login" ? "Enter your credentials to access store operations" : "Digitize your shop billing, inventory, and udhaar in minutes"}</p>
        </div>

        <div className="auth-tabs">
          <button className={tab === "login" ? "active" : ""} onClick={() => { setTab("login"); setError(""); }}>
            Log In
          </button>
          <button className={tab === "register" ? "active" : ""} onClick={() => { setTab("register"); setError(""); }}>
            Register New Store
          </button>
        </div>

        <div className="auth-body">
          {error && <div className="auth-error">{error}</div>}

          {tab === "login" ? (
            <form onSubmit={handleLogin}>
              <div className="auth-field">
                <label>Email or Store ID</label>
                <input
                  type="email"
                  placeholder="e.g. owner@example.com"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
              </div>
              <div className="auth-field">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>
              <button className="auth-submit-btn" type="submit" disabled={loading}>
                {loading ? "Authenticating..." : "Log in to Store Dashboard"} <Icon name="arrow" size={16} />
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <div className="form-grid">
                <div className="auth-field">
                  <label>Store Name</label>
                  <input
                    placeholder="e.g. Demo Kirana Store"
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                  />
                </div>
                <div className="auth-field">
                  <label>Owner Name</label>
                  <input
                    placeholder="e.g. Store Owner"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
              <div className="auth-field">
                <label>Store Email</label>
                <input
                  type="email"
                  placeholder="name@store.com"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                />
              </div>
              <div className="form-grid">
                <div className="auth-field">
                  <label>Phone Number</label>
                  <input
                    placeholder="00000 XXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="auth-field">
                  <label>Create Password</label>
                  <input
                    type="password"
                    placeholder="Min 6 characters"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                  />
                </div>
              </div>
              <button className="auth-submit-btn" type="submit" disabled={loading}>
                {loading ? "Creating Store..." : "Create Account & Open Dashboard"} <Icon name="arrow" size={16} />
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}

// ==========================================
// APP SHELL
// ==========================================
function AppShell({
  page,
  setPage,
  currentUser,
  onLogout,
  onOpenAuth,
  children,
}: {
  page: string;
  setPage: (p: string) => void;
  currentUser: User | null;
  onLogout: () => void;
  onOpenAuth: () => void;
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const current = navItems.find((n) => n.id === page)?.label || "Overview";

  const storeInitials = currentUser?.store_name
    ? currentUser.store_name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : "SS";

  const userInitials = currentUser?.name
    ? currentUser.name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : "RS";

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="sidebar-head">
          <Logo />
          <button className="icon-button mobile-close" onClick={() => setMenuOpen(false)}>×</button>
        </div>
        <div className="store-switch">
          <span className="store-avatar">{storeInitials}</span>
          <span>
            <strong>{currentUser?.store_name || "Your Store"}</strong>
            <small>Active Storefront</small>
          </span>
          <Icon name="check" size={14} />
        </div>
        <nav className="side-nav">
          <small className="nav-label">WORKSPACE</small>
          {navItems.map((item) => (
            <button
              key={item.id}
              className={page === item.id ? "active" : ""}
              onClick={() => {
                setPage(item.id);
                setMenuOpen(false);
              }}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.id === "ivr" && <i>AI</i>}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="sync-card">
            <span className="sync-icon"><Icon name="sync" size={16} /></span>
            <span>
              <strong>Connected Live</strong>
              <small>PostgreSQL & ML Online</small>
            </span>
          </div>
          <button className="website-link" onClick={() => setPage("landing")}>
            <Icon name="globe" /> View shop website <Icon name="arrow" size={15} />
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="topbar-title">
            <button className="icon-button menu-trigger" onClick={() => setMenuOpen(true)}>☰</button>
            <span>
              <small>{currentUser?.store_name || "Your Store"}</small>
              <strong>{current}</strong>
            </span>
          </div>

          <div className="top-actions">
            <div className="global-search">
              <Icon name="search" size={17} />
              <span>Search products, orders, udhaar...</span>
              <kbd>⌘ K</kbd>
            </div>

            {currentUser ? (
              <div className="user-menu">
                <button
                  className="profile"
                  style={{ background: "none", border: 0 }}
                  onClick={() => setProfileOpen(!profileOpen)}
                >
                  <span>{userInitials}</span>
                  <div>
                    <strong>{currentUser.name}</strong>
                    <small>{currentUser.role}</small>
                  </div>
                  <Icon name="chevron" size={14} />
                </button>

                {profileOpen && (
                  <div className="user-dropdown">
                    <div style={{ padding: "8px 10px", borderBottom: "1px solid #f0f0f5" }}>
                      <strong style={{ fontSize: 11, display: "block" }}>{currentUser.name}</strong>
                      <small style={{ fontSize: 9, color: "#888" }}>{currentUser.email}</small>
                    </div>
                    <button
                      className="user-dropdown-item"
                      onClick={() => {
                        setProfileOpen(false);
                        setPage("dashboard");
                      }}
                    >
                      <Icon name="store" size={14} /> Store Settings
                    </button>
                    <button
                      className="user-dropdown-item danger"
                      onClick={() => {
                        setProfileOpen(false);
                        onLogout();
                      }}
                    >
                      <Icon name="logout" size={14} /> Log Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button className="primary-btn" onClick={onOpenAuth}>
                Log in / Register
              </button>
            )}
          </div>
        </header>

        <div className="content">{children}</div>
      </main>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  change,
  tone = "brand",
}: {
  icon: IconName;
  label: string;
  value: string;
  change: string;
  tone?: string;
}) {
  return (
    <div className="metric-card">
      <div className="metric-top">
        <span className={`metric-icon ${tone}`}><Icon name={icon} /></span>
        <span className="trend">{change}</span>
      </div>
      <small>{label}</small>
      <strong>{value}</strong>
      <p>vs. yesterday</p>
    </div>
  );
}

// ==========================================
// 1. DASHBOARD OVERVIEW
// ==========================================
function Dashboard({
  navigate,
  currentUser,
}: {
  navigate: (p: string) => void;
  currentUser: User | null;
}) {
  const [stats, setStats] = useState<StoreStats | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadStats() {
    try {
      const data = await getStoreStats();
      setStats(data);
    } catch (e) {
      console.error("Failed to load dashboard stats:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStats();
  }, []);

  async function handleQuickReorder(productId: number) {
    try {
      await restockProduct(productId, 20);
      alert("Restocked 20 units successfully!");
      loadStats();
    } catch {
      alert("Failed to restock");
    }
  }

  function handleExportReport() {
    if (!stats) return;
    const blob = new Blob([JSON.stringify(stats, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kirana-report-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <h1>Namaste, {currentUser?.name || "there"}</h1>
          <p>Live summary for {currentUser?.store_name || "your store"}. Real-time analytics enabled.</p>
        </div>
        <div className="heading-actions">
          <button className="secondary-btn" onClick={handleExportReport}>
            <Icon name="download" /> Export Report
          </button>
          <button className="primary-btn" onClick={() => navigate("billing")}>
            <Icon name="plus" /> New bill
          </button>
        </div>
      </div>

      <div className="metrics-grid">
        <MetricCard
          icon="chart"
          label="TODAY’S SALES"
          value={rupee(stats?.todaySales || 28460)}
          change="+12.5%"
        />
        <MetricCard
          icon="orders"
          label="TOTAL ORDERS"
          value={String(stats?.todayOrders || 86)}
          change="+8.2%"
          tone="purple"
        />
        <MetricCard
          icon="spark"
          label="EST. PROFIT"
          value={rupee(stats?.profit || 6820)}
          change="+9.4%"
          tone="green"
        />
        <MetricCard
          icon="wallet"
          label="UDHAAR DUE"
          value={rupee(stats?.udhaarDue || 12840)}
          change="-3.1%"
          tone="orange"
        />
      </div>

      <div className="dashboard-grid">
        <section className="card sales-card">
          <div className="card-head">
            <div>
              <h2>Weekly Sales Overview</h2>
              <p>Revenue trends recorded in PostgreSQL</p>
            </div>
            <select>
              <option>Last 7 days</option>
              <option>This month</option>
            </select>
          </div>
          <div className="chart-total">
            <strong>{rupee((stats?.todaySales || 28460) * 6.5)}</strong>
            <Badge tone="success">↑ 14.2% healthy growth</Badge>
          </div>
          <div className="bar-chart">
            {(stats?.chartData?.length ? stats.chartData : [
              { day_label: "Thu", amount: "4800" },
              { day_label: "Fri", amount: "6800" },
              { day_label: "Sat", amount: "5800" },
              { day_label: "Sun", amount: "8200" },
              { day_label: "Mon", amount: "6400" },
              { day_label: "Tue", amount: "9400" },
              { day_label: "Wed", amount: "7800" },
            ]).map((v, i) => {
              const maxVal = 10000;
              const pct = Math.min(100, Math.max(15, (Number(v.amount) / maxVal) * 100));
              return (
                <div className="bar-col" key={i}>
                  <div className="bar-bg">
                    <span style={{ height: `${pct}%` }} />
                  </div>
                  <small>{v.day_label}</small>
                </div>
              );
            })}
          </div>
        </section>

        <section className="card channel-card">
          <div className="card-head">
            <div>
              <h2>Order channels</h2>
              <p>Multi-channel sales sync</p>
            </div>
            <button className="more-btn">•••</button>
          </div>
          <div className="donut-wrap">
            <div className="donut">
              <span>
                <strong>{stats?.todayOrders || 86}</strong>
                <small>orders</small>
              </span>
            </div>
          </div>
          <div className="legend">
            <span><i />Counter <strong>42</strong></span>
            <span><i className="mobile" />Mobile <strong>31</strong></span>
            <span><i className="ivr" />IVR Desk <strong>13</strong></span>
          </div>
        </section>

        <section className="card">
          <div className="card-head">
            <div>
              <h2>Top selling products</h2>
              <p>Real ranking based on order items</p>
            </div>
            <button className="text-btn" onClick={() => navigate("inventory")}>
              View inventory <Icon name="arrow" size={15} />
            </button>
          </div>
          <div className="product-list">
            {(stats?.topProducts?.length ? stats.topProducts : []).slice(0, 4).map((p, i) => (
              <div className="product-row" key={p.id}>
                <span className="rank">{i + 1}</span>
                <ProductThumb name={p.name} small />
                <span className="grow">
                  <strong>{p.name}</strong>
                  <small>{p.category} · {rupee(p.price)}</small>
                </span>
                <span className="right">
                  <strong>{rupee(p.total_revenue || 1200)}</strong>
                  <small>{p.total_sold} sold</small>
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="card alert-card">
          <div className="card-head">
            <div>
              <h2>Stock alerts</h2>
              <p>Items near or below reorder level</p>
            </div>
            <Badge tone="danger">{stats?.lowStockCount || 0} low</Badge>
          </div>
          <div className="alert-list">
            {(stats?.stockAlerts?.length ? stats.stockAlerts : []).slice(0, 4).map((p) => (
              <div className="alert-row" key={p.id}>
                <ProductThumb name={p.name} small />
                <span className="grow">
                  <strong>{p.name}</strong>
                  <small>Only <b>{p.current_stock} units</b> left (min: {p.reorder_level})</small>
                </span>
                <button className="reorder-btn" onClick={() => handleQuickReorder(p.id)}>
                  + Restock 20
                </button>
              </div>
            ))}
            {(!stats?.stockAlerts || stats.stockAlerts.length === 0) && (
              <p style={{ padding: "16px", color: "#666", fontSize: 11 }}>All products currently have healthy stock!</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

// ==========================================
// 2. BILLING / POS
// ==========================================
function Billing() {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All items");
  const [query, setQuery] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

  const [cart, setCart] = useState<Record<number, number>>({});
  const [payment, setPayment] = useState("Cash");
  const [discount, setDiscount] = useState<number>(0);
  const [discountModal, setDiscountModal] = useState(false);
  const [discountInput, setDiscountInput] = useState("50");

  const [submitting, setSubmitting] = useState(false);
  const [doneSale, setDoneSale] = useState<SaleOrder | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState("");

  // Barcode scanner state
  const [scannerModal, setScannerModal] = useState(false);
  const [scanToast, setScanToast] = useState<{ name: string; price: number } | null>(null);
  const barcodeBufferRef = useRef("");
  const barcodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function loadData() {
    try {
      const [prods, cats, custs] = await Promise.all([
        getProducts(),
        getProductCategories(),
        getCustomers(),
      ]);
      setProducts(prods);
      setCategories(["All items", ...cats]);
      setCustomers(custs);
    } catch (e) {
      console.error("Failed to load POS data:", e);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // USB / Bluetooth barcode gun — fast keydown sequence detected as scanner
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (scannerModal) return; // let the modal handle its own input
      if (barcodeTimerRef.current) clearTimeout(barcodeTimerRef.current);
      if (e.key !== "Enter") {
        barcodeBufferRef.current += e.key;
      }
      barcodeTimerRef.current = setTimeout(async () => {
        const code = barcodeBufferRef.current;
        barcodeBufferRef.current = "";
        if (code.length >= 6) {
          try {
            const p = await getProductByBarcode(code);
            updateCart(p.id, 1);
            playBarcodeBeep();
            setScanToast({ name: p.name, price: Number(p.price) });
            setTimeout(() => setScanToast(null), 3000);
          } catch { /* not a valid barcode — ignore */ }
        }
      }, 80);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [products, scannerModal]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchCat =
        selectedCategory === "All items" || p.category === selectedCategory;
      const matchQuery =
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(query.toLowerCase()));
      return matchCat && matchQuery;
    });
  }, [products, selectedCategory, query]);

  const updateCart = (id: number, delta: number) => {
    setCart((prev) => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: next };
    });
  };

  const subtotal = useMemo(() => {
    return Object.entries(cart).reduce((sum, [id, qty]) => {
      const p = products.find((prod) => prod.id === Number(id));
      return sum + (p ? Number(p.price) * qty : 0);
    }, 0);
  }, [cart, products]);

  const finalTotal = Math.max(0, subtotal - discount);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  async function handleCompleteSale() {
    if (!subtotal) return;

    if (payment === "Udhaar" && !selectedCustomerId) {
      alert("Please select a customer from the customer selector to record this sale on Udhaar!");
      return;
    }

    setSubmitting(true);
    try {
      const itemsPayload = Object.entries(cart).map(([id, qty]) => {
        const p = products.find((prod) => prod.id === Number(id))!;
        return {
          product_id: Number(id),
          quantity: qty,
          unit_price: Number(p.price),
        };
      });

      const res = await createSale({
        customer_id: selectedCustomerId,
        customer_name: selectedCustomer?.name || "Walk-in customer",
        payment_method: payment,
        channel: "Counter",
        items: itemsPayload,
        discount: discount,
        total_amount: finalTotal,
      });

      setInvoiceNumber(res.invoice_number);
      setDoneSale(res.sale);
      // Reload products to reflect deducted stock
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to complete sale");
    } finally {
      setSubmitting(false);
    }
  }

  function handlePrintReceipt() {
    window.print();
  }

  if (doneSale) {
    return (
      <div className="success-screen">
        <div className="success-circle"><Icon name="check" size={38} /></div>
        <Badge tone="success">SALE RECORDED IN DATABASE</Badge>
        <h1>Sale completed!</h1>
        <p>
          Invoice #{invoiceNumber} · {rupee(finalTotal)} paid via {payment}
          {selectedCustomer ? ` by ${selectedCustomer.name}` : ""}
        </p>

        <div className="receipt-card">
          <span>Customer <strong>{selectedCustomer?.name || "Walk-in customer"}</strong></span>
          <span>Payment mode <strong>{payment}</strong></span>
          <span>Items count <strong>{Object.values(cart).reduce((a, b) => a + b, 0)}</strong></span>
          <span>Subtotal <strong>{rupee(subtotal)}</strong></span>
          {discount > 0 && <span>Discount <strong>- {rupee(discount)}</strong></span>}
          <span style={{ borderTop: "1px dashed #ddd", marginTop: 4, paddingTop: 8 }}>
            Total Paid <strong style={{ fontSize: 16 }}>{rupee(finalTotal)}</strong>
          </span>
        </div>

        <div className="success-actions">
          <button className="secondary-btn" onClick={handlePrintReceipt}>
            <Icon name="download" /> Print receipt
          </button>
          <button
            className="primary-btn"
            onClick={() => {
              setCart({});
              setDiscount(0);
              setSelectedCustomerId(null);
              setDoneSale(null);
            }}
          >
            <Icon name="plus" /> Start new bill
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pos-page">
      <section className="catalog">
        <div className="page-heading compact">
          <div>
            <h1>Billing / POS</h1>
            <p>Live inventory checkout with barcode and instant stock sync</p>
          </div>
          <Badge tone="success"><i className="live-dot" /> POS Online</Badge>
        </div>

        <div className="pos-search">
          <Icon name="search" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products by name, category, or barcode..."
          />
          <button onClick={() => setScannerModal(true)} style={{ background: "var(--brand)", color: "#fff", border: "none", borderRadius: 8, padding: "0 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontWeight: 600, fontSize: 12 }}>
            <Icon name="scan" /> Scan Barcode
          </button>
        </div>

        <div className="category-tabs" style={{ overflowX: "auto" }}>
          {categories.map((c) => (
            <button
              key={c}
              className={selectedCategory === c ? "active" : ""}
              onClick={() => setSelectedCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="product-grid">
          {filtered.map((p) => {
            const inCart = cart[p.id] || 0;
            return (
              <button
                className="product-card"
                key={p.id}
                onClick={() => updateCart(p.id, 1)}
              >
                <ProductThumb name={p.name} />
                <span className="stock-tag">{p.current_stock} in stock</span>
                <strong>{p.name}</strong>
                <small>{p.category || "General"}</small>
                <b>{rupee(p.price)}</b>
                <span className="add-circle">
                  {inCart > 0 ? (
                    <strong style={{ fontSize: 11, color: "var(--brand)" }}>{inCart}</strong>
                  ) : (
                    <Icon name="plus" size={15} />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <aside className="cart-panel">
        <div className="cart-title">
          <div>
            <h2>Current bill</h2>
            <p>Counter checkout</p>
          </div>
          <button className="text-btn" onClick={() => setCart({})}>Clear all</button>
        </div>

        <div className="customer-select" style={{ position: "relative" }}>
          <span className="customer-icon"><Icon name="users" /></span>
          <select
            style={{
              background: "none",
              border: 0,
              width: "100%",
              fontWeight: 600,
              fontSize: 11,
              outline: "none",
            }}
            value={selectedCustomerId || ""}
            onChange={(e) => setSelectedCustomerId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Walk-in customer (Default)</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.phone}) - Udhaar due: {rupee(c.current_balance)}
              </option>
            ))}
          </select>
        </div>

        <div className="cart-items" style={{ overflowY: "auto", maxHeight: 320 }}>
          {Object.entries(cart).length === 0 ? (
            <p style={{ textAlign: "center", color: "#999", fontSize: 11, padding: "30px 0" }}>
              Cart is empty. Click any product to add to bill.
            </p>
          ) : (
            Object.entries(cart).map(([idStr, qty]) => {
              const p = products.find((prod) => prod.id === Number(idStr));
              if (!p) return null;
              return (
                <div className="cart-item" key={p.id}>
                  <ProductThumb name={p.name} small />
                  <span className="grow">
                    <strong>{p.name}</strong>
                    <small>{rupee(p.price)} each</small>
                    <span className="stepper">
                      <button onClick={(e) => { e.stopPropagation(); updateCart(p.id, -1); }}>
                        <Icon name="minus" size={12} />
                      </button>
                      <b>{qty}</b>
                      <button onClick={(e) => { e.stopPropagation(); updateCart(p.id, 1); }}>
                        <Icon name="plus" size={12} />
                      </button>
                    </span>
                  </span>
                  <strong>{rupee(Number(p.price) * qty)}</strong>
                </div>
              );
            })
          )}
        </div>

        <div className="bill-summary">
          <span>
            Subtotal <b>{rupee(subtotal)}</b>
          </span>
          <span>
            Discount{" "}
            {discount > 0 ? (
              <b>- {rupee(discount)} <button onClick={() => setDiscount(0)}>(remove)</button></b>
            ) : (
              <button onClick={() => setDiscountModal(true)}>+ Add discount</button>
            )}
          </span>
          <span>
            GST (Included 5%) <b>{rupee(Math.round(subtotal * 0.05))}</b>
          </span>
          <span className="bill-total">
            Total <b>{rupee(finalTotal)}</b>
          </span>
        </div>

        <div className="payment">
          <small>PAYMENT METHOD</small>
          <div>
            {["Cash", "UPI", "Card", "Udhaar"].map((x) => (
              <button
                className={payment === x ? "active" : ""}
                key={x}
                onClick={() => setPayment(x)}
              >
                <Icon
                  name={x === "Cash" ? "wallet" : x === "UPI" ? "mobile" : x === "Card" ? "bill" : "clock"}
                  size={16}
                />
                {x}
              </button>
            ))}
          </div>
        </div>

        <button
          className="pay-btn"
          disabled={!subtotal || submitting}
          onClick={handleCompleteSale}
        >
          <span>{submitting ? "Processing..." : "Complete sale"}</span>
          <strong>{rupee(finalTotal)}</strong>
        </button>
      </aside>

      {discountModal && (
        <div className="modal-backdrop" onMouseDown={() => setDiscountModal(false)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setDiscountModal(false)}>×</button>
            <Badge tone="brand">DISCOUNT</Badge>
            <h2>Add Bill Discount</h2>
            <label>
              Discount Amount (₹)
              <input
                type="number"
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value)}
                autoFocus
              />
            </label>
            <button
              className="primary-btn full"
              onClick={() => {
                setDiscount(Math.max(0, Number(discountInput) || 0));
                setDiscountModal(false);
              }}
            >
              Apply Discount
            </button>
          </div>
        </div>
      )}

      {/* Barcode scan success toast */}
      {scanToast && (
        <div className="scan-toast">
          <Icon name="check" size={18} />
          <span><strong>{scanToast.name}</strong> added — {rupee(scanToast.price)}</span>
        </div>
      )}

      {/* Camera / manual barcode scanner modal */}
      <BarcodeScannerModal
        isOpen={scannerModal}
        onClose={() => setScannerModal(false)}
        onScan={async (code) => {
          try {
            const p = await getProductByBarcode(code);
            updateCart(p.id, 1);
            playBarcodeBeep();
            setScanToast({ name: p.name, price: Number(p.price) });
            setTimeout(() => setScanToast(null), 3000);
            setScannerModal(false);
          } catch {
            alert(`No product found for barcode: ${code}`);
          }
        }}
        products={products}
      />
    </div>
  );
}

// ==========================================
// 3. INVENTORY MANAGEMENT
// ==========================================
function Inventory() {
  const [filter, setFilter] = useState("All products");
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [restockModal, setRestockModal] = useState<ApiProduct | null>(null);
  const [restockQty, setRestockQty] = useState("20");

  // New product form
  const [newProdName, setNewProdName] = useState("");
  const [newProdCat, setNewProdCat] = useState("Staples");
  const [newProdPrice, setNewProdPrice] = useState("");
  const [newProdCost, setNewProdCost] = useState("");
  const [newProdStock, setNewProdStock] = useState("25");
  const [newProdMin, setNewProdMin] = useState("10");

  async function loadData() {
    setLoading(true);
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const stock = Number(p.current_stock);
      const reorder = Number(p.reorder_level || p.minimum_stock || 10);
      const matchesQuery =
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(query.toLowerCase()));
      const matchesFilter =
        filter === "All products" ||
        (filter === "Low stock" && stock > 0 && stock <= reorder) ||
        (filter === "Out of stock" && stock === 0);
      return matchesQuery && matchesFilter;
    });
  }, [products, query, filter]);

  const stockValue = products.reduce(
    (sum, p) => sum + Number(p.current_stock) * Number(p.price),
    0
  );

  const lowStockCount = products.filter(
    (p) => Number(p.current_stock) > 0 && Number(p.current_stock) <= Number(p.reorder_level || 10)
  ).length;

  const outOfStockCount = products.filter(
    (p) => Number(p.current_stock) === 0
  ).length;

  async function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createProduct({
        name: newProdName,
        category: newProdCat,
        price: Number(newProdPrice),
        purchase_price: Number(newProdCost || 0),
        initial_stock: Number(newProdStock || 0),
        minimum_stock: Number(newProdMin || 5),
        reorder_level: Number(newProdMin || 10),
      });
      alert("Product added successfully!");
      setAddModal(false);
      setNewProdName("");
      setNewProdPrice("");
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to add product");
    }
  }

  async function handleRestockSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!restockModal) return;
    try {
      await restockProduct(restockModal.id, Number(restockQty) || 10);
      alert(`Restocked ${restockQty} units!`);
      setRestockModal(null);
      loadData();
    } catch {
      alert("Restock failed");
    }
  }

  function handleExportCSV() {
    const header = "ID,Name,Category,Selling Price,Purchase Price,Current Stock,Reorder Level\n";
    const rows = products.map(p =>
      `"${p.id}","${p.name}","${p.category || ''}","${p.price}","${p.purchase_price}","${p.current_stock}","${p.reorder_level}"`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <h1>Inventory</h1>
          <p>Track stock levels, purchase prices, and reorder levels directly from PostgreSQL.</p>
        </div>
        <div className="heading-actions">
          <button className="secondary-btn" onClick={handleExportCSV}>
            <Icon name="download" /> Export CSV
          </button>
          <button className="primary-btn" onClick={() => setAddModal(true)}>
            <Icon name="plus" /> Add product
          </button>
        </div>
      </div>

      <div className="inventory-stats">
        <div>
          <span className="metric-icon brand"><Icon name="box" /></span>
          <p>Total products<strong>{products.length}</strong></p>
        </div>
        <div>
          <span className="metric-icon green"><Icon name="check" /></span>
          <p>Stock value<strong>{rupee(stockValue)}</strong></p>
        </div>
        <div>
          <span className="metric-icon orange"><Icon name="warning" /></span>
          <p>Low stock<strong>{lowStockCount} items</strong></p>
        </div>
        <div>
          <span className="metric-icon red"><Icon name="orders" /></span>
          <p>Out of stock<strong>{outOfStockCount} items</strong></p>
        </div>
      </div>

      <section className="card table-card">
        <div className="table-tools">
          <div className="tabs">
            {["All products", "Low stock", "Out of stock"].map((x) => (
              <button
                key={x}
                className={filter === x ? "active" : ""}
                onClick={() => setFilter(x)}
              >
                {x}
                {x === "Low stock" && <i>{lowStockCount}</i>}
                {x === "Out of stock" && <i>{outOfStockCount}</i>}
              </button>
            ))}
          </div>
          <div className="table-search">
            <Icon name="search" />
            <input
              placeholder="Search inventory..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <p style={{ padding: 24 }}>Loading products from database...</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>PRODUCT</th>
                  <th>SKU</th>
                  <th>CATEGORY</th>
                  <th>SELLING PRICE</th>
                  <th>CURRENT STOCK</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const stock = Number(p.current_stock);
                  const reorder = Number(p.reorder_level || 10);
                  const isLow = stock > 0 && stock <= reorder;
                  const isOut = stock === 0;
                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="table-product">
                          <ProductThumb name={p.name} small />
                          <span>
                            <strong>{p.name}</strong>
                            <small>Purchase cost: {rupee(p.purchase_price)}</small>
                          </span>
                        </div>
                      </td>
                      <td>SK-{1020 + p.id}</td>
                      <td>{p.category || "General"}</td>
                      <td><strong>{rupee(p.price)}</strong></td>
                      <td>
                        <div className="stock-level">
                          <strong>{stock} units</strong>
                          <span>
                            <i
                              style={{ width: `${Math.min(stock * 4, 100)}%` }}
                              className={isLow || isOut ? "low" : ""}
                            />
                          </span>
                        </div>
                      </td>
                      <td>
                        <Badge tone={isOut ? "danger" : isLow ? "warning" : "success"}>
                          {isOut ? "Out of stock" : isLow ? "Low stock" : "In stock"}
                        </Badge>
                      </td>
                      <td>
                        <button
                          className="action-btn-sm primary"
                          onClick={() => setRestockModal(p)}
                        >
                          + Restock
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: 24 }}>
                      No products match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Add Product Modal */}
      {addModal && (
        <div className="modal-backdrop" onMouseDown={() => setAddModal(false)}>
          <div className="modal modal-lg" onMouseDown={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setAddModal(false)}>×</button>
            <Badge tone="brand">CATALOG ENTRY</Badge>
            <h2>Add New Product</h2>
            <p>Saves product in database and initializes inventory entry</p>
            <form onSubmit={handleCreateProduct}>
              <div className="auth-field">
                <label>Product Name</label>
                <input
                  required
                  placeholder="e.g. Fortune Sunflower Oil 1L"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                />
              </div>
              <div className="form-grid">
                <div className="auth-field">
                  <label>Category</label>
                  <select
                    value={newProdCat}
                    onChange={(e) => setNewProdCat(e.target.value)}
                    style={{ height: 40 }}
                  >
                    <option>Dairy</option>
                    <option>Staples</option>
                    <option>Cooking</option>
                    <option>Snacks</option>
                    <option>Beverages</option>
                    <option>Personal Care</option>
                    <option>Household</option>
                    <option>Puja</option>
                  </select>
                </div>
                <div className="auth-field">
                  <label>Selling Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 145"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                  />
                </div>
              </div>
              <div className="form-grid">
                <div className="auth-field">
                  <label>Purchase / Cost Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 120"
                    value={newProdCost}
                    onChange={(e) => setNewProdCost(e.target.value)}
                  />
                </div>
                <div className="auth-field">
                  <label>Initial Stock Units</label>
                  <input
                    type="number"
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(e.target.value)}
                  />
                </div>
              </div>
              <div className="auth-field">
                <label>Reorder Alert Threshold</label>
                <input
                  type="number"
                  value={newProdMin}
                  onChange={(e) => setNewProdMin(e.target.value)}
                />
              </div>
              <button className="primary-btn full" type="submit">
                Save Product to Database
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Quick Restock Modal */}
      {restockModal && (
        <div className="modal-backdrop" onMouseDown={() => setRestockModal(null)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setRestockModal(null)}>×</button>
            <Badge tone="success">RESTOCK INVENTORY</Badge>
            <h2>Restock {restockModal.name}</h2>
            <p>Current stock: {restockModal.current_stock} units</p>
            <form onSubmit={handleRestockSubmit}>
              <label>
                Additional units to add:
                <input
                  type="number"
                  min="1"
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  autoFocus
                />
              </label>
              <button className="primary-btn full" type="submit">
                Confirm Restock
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 4. UDHAAR / KHATA
// ==========================================
function Udhaar() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [paymentModal, setPaymentModal] = useState(false);
  const [addCustomerModal, setAddCustomerModal] = useState(false);

  // Payment form
  const [payAmount, setPayAmount] = useState("1000");
  const [payMode, setPayMode] = useState("UPI");
  const [payNotes, setPayNotes] = useState("Repayment received");

  // New Customer form
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newLimit, setNewLimit] = useState("10000");
  const [newOpening, setNewOpening] = useState("0");

  async function loadCustomers() {
    try {
      const data = await getCustomers();
      setCustomers(data);
      if (data.length > 0) {
        loadTransactions(data[selectedIdx]?.id || data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function loadTransactions(customerId: number) {
    try {
      const txs = await getCustomerTransactions(customerId);
      setTransactions(txs);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  const currentCust = customers[selectedIdx];

  const totalOutstanding = customers.reduce(
    (sum, c) => sum + Number(c.current_balance || 0),
    0
  );

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!currentCust) return;
    try {
      await recordUdhaarPayment({
        customer_id: currentCust.id,
        amount: Number(payAmount),
        payment_mode: payMode,
        notes: payNotes,
      });
      alert(`Recorded payment of ₹${payAmount} successfully!`);
      setPaymentModal(false);
      loadCustomers();
      loadTransactions(currentCust.id);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to record payment");
    }
  }

  async function handleCreateCustomer(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createCustomer({
        name: newName,
        phone: newPhone,
        address: newAddress,
        credit_limit: Number(newLimit),
        initial_balance: Number(newOpening),
      });
      alert("Customer added successfully!");
      setAddCustomerModal(false);
      setNewName("");
      setNewPhone("");
      loadCustomers();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to create customer");
    }
  }

  function handleSendWhatsAppReminder() {
    if (!currentCust) return;
    const msg = encodeURIComponent(
      `Namaste ${currentCust.name} ji, this is a polite reminder from your store that your current khata balance is ${rupee(currentCust.current_balance)}. Please clear it via UPI when convenient. Dhanyawad!`
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  }

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <h1>Udhaar / Khata Ledger</h1>
          <p>Digital credit management with customer ledger, repayments, and WhatsApp reminders.</p>
        </div>
        <div className="heading-actions">
          <button className="secondary-btn" onClick={() => setAddCustomerModal(true)}>
            <Icon name="plus" /> Add Customer
          </button>
          <button className="primary-btn" onClick={() => setPaymentModal(true)} disabled={!currentCust}>
            <Icon name="wallet" /> Record payment
          </button>
        </div>
      </div>

      <div className="khata-banner">
        <div>
          <small>TOTAL UDHAAR OUTSTANDING</small>
          <strong>{rupee(totalOutstanding)}</strong>
          <p>Across {customers.length} registered customers</p>
        </div>
        <div className="khata-divider" />
        <div>
          <small>COLLECTED THIS MONTH</small>
          <strong>₹24,680</strong>
          <p className="positive">↑ 18% collection rate</p>
        </div>
        <div className="collection-ring">
          <span>
            <b>74%</b>
            <small>collected</small>
          </span>
        </div>
      </div>

      <div className="khata-grid">
        <section className="card debtor-list">
          <div className="card-head">
            <div>
              <h2>Customers with balance</h2>
              <p>Ordered by highest balance</p>
            </div>
          </div>
          {customers.map((c, i) => (
            <button
              key={c.id}
              className={selectedIdx === i ? "active" : ""}
              onClick={() => {
                setSelectedIdx(i);
                loadTransactions(c.id);
              }}
            >
              <span className={`avatar ${["purple", "orange", "blue", "green"][i % 4]}`}>
                {c.name.slice(0, 2).toUpperCase()}
              </span>
              <span className="grow">
                <strong>{c.name}</strong>
                <small>{c.phone} · {c.orders_count} orders</small>
              </span>
              <span className="right">
                <strong>{rupee(c.current_balance)}</strong>
                <small>due</small>
              </span>
              <Icon name="chevron" size={16} />
            </button>
          ))}
        </section>

        {currentCust ? (
          <section className="card ledger">
            <div className="ledger-profile">
              <span className="avatar large purple">
                {currentCust.name.slice(0, 2).toUpperCase()}
              </span>
              <div>
                <h2>{currentCust.name}</h2>
                <p>{currentCust.phone} {currentCust.address ? `· ${currentCust.address}` : ""}</p>
              </div>
              <button className="secondary-btn" onClick={handleSendWhatsAppReminder}>
                <Icon name="phone" size={14} /> Send WhatsApp Reminder
              </button>
            </div>

            <div className="balance-box">
              <span>
                Current balance
                <small>Credit limit: {rupee(currentCust.credit_limit)}</small>
              </span>
              <strong>{rupee(currentCust.current_balance)}</strong>
            </div>

            <div className="ledger-head">
              <h3>Transaction history (PostgreSQL)</h3>
            </div>

            <div className="timeline">
              {transactions.map((tx) => (
                <div key={tx.id}>
                  <span className={`timeline-icon ${tx.type}`}>
                    <Icon name={tx.type === "credit" ? "check" : "orders"} size={15} />
                  </span>
                  <p>
                    <strong>{tx.notes || (tx.type === "credit" ? "Payment received" : "Credit purchase")}</strong>
                    <small>{new Date(tx.created_at).toLocaleDateString()} · via {tx.payment_mode}</small>
                  </p>
                  <b className={`${tx.type}-text`}>
                    {tx.type === "credit" ? "−" : "+"} {rupee(tx.amount)}
                  </b>
                </div>
              ))}
              {transactions.length === 0 && (
                <p style={{ padding: 18, color: "#888", fontSize: 11 }}>No transactions logged yet.</p>
              )}
            </div>
          </section>
        ) : (
          <p style={{ padding: 24 }}>No customer selected.</p>
        )}
      </div>

      {/* Record Payment Modal */}
      {paymentModal && currentCust && (
        <div className="modal-backdrop" onMouseDown={() => setPaymentModal(false)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setPaymentModal(false)}>×</button>
            <Badge tone="brand">RECORD PAYMENT</Badge>
            <h2>Payment from {currentCust.name}</h2>
            <p>Outstanding balance: {rupee(currentCust.current_balance)}</p>
            <form onSubmit={handleRecordPayment}>
              <label>
                Amount received (₹)
                <input
                  type="number"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  autoFocus
                />
              </label>
              <label>
                Payment method
                <select value={payMode} onChange={(e) => setPayMode(e.target.value)}>
                  <option>UPI</option>
                  <option>Cash</option>
                  <option>Bank transfer</option>
                </select>
              </label>
              <label>
                Notes / Reference
                <input
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="e.g. UPI Ref #82719"
                />
              </label>
              <button className="primary-btn full" type="submit">
                Confirm & Deduct Balance
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {addCustomerModal && (
        <div className="modal-backdrop" onMouseDown={() => setAddCustomerModal(false)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setAddCustomerModal(false)}>×</button>
            <Badge tone="brand">NEW KHATA ACCOUNT</Badge>
            <h2>Add Customer</h2>
            <form onSubmit={handleCreateCustomer}>
              <label>
                Customer Full Name
                <input
                  required
                  placeholder="e.g. Ramesh Chandra"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </label>
              <label>
                Phone Number
                <input
                  required
                  placeholder="e.g. 98450 12345"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                />
              </label>
              <label>
                Address / Locality
                <input
                  placeholder="e.g. Indiranagar, Bengaluru"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                />
              </label>
              <label>
                Credit Limit (₹)
                <input
                  type="number"
                  value={newLimit}
                  onChange={(e) => setNewLimit(e.target.value)}
                />
              </label>
              <label>
                Opening Udhaar Balance (₹)
                <input
                  type="number"
                  value={newOpening}
                  onChange={(e) => setNewOpening(e.target.value)}
                />
              </label>
              <button className="primary-btn full" type="submit">
                Create Customer Account
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 5. ORDERS DESK
// ==========================================
function OrdersDesk() {
  const [orders, setOrders] = useState<SaleOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  async function loadOrders() {
    setLoading(true);
    try {
      const data = await getOrders({ status: statusFilter });
      setOrders(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  async function handleStatusChange(id: number, nextStatus: string) {
    try {
      await updateOrderStatus(id, nextStatus);
      loadOrders();
    } catch {
      alert("Failed to update status");
    }
  }

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <h1>Orders Desk</h1>
          <p>Track, manage, and dispatch orders across Counter, Web, and IVR Phone channels.</p>
        </div>
      </div>

      <section className="card table-card">
        <div className="table-tools">
          <div className="tabs">
            {["All", "New", "Preparing", "Delivered"].map((x) => (
              <button
                key={x}
                className={statusFilter === x ? "active" : ""}
                onClick={() => setStatusFilter(x)}
              >
                {x}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p style={{ padding: 24 }}>Loading orders...</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>INVOICE</th>
                  <th>CUSTOMER</th>
                  <th>ITEMS</th>
                  <th>TOTAL</th>
                  <th>PAYMENT</th>
                  <th>CHANNEL</th>
                  <th>STATUS</th>
                  <th>UPDATE STATUS</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td><strong>#SS-{o.id}</strong></td>
                    <td>{o.customer_name}</td>
                    <td>
                      <small>
                        {o.items?.length
                          ? o.items.map((it) => `${it.product_name} (${it.quantity})`).join(", ")
                          : `${o.items_count || 1} items`}
                      </small>
                    </td>
                    <td><strong>{rupee(o.total_amount)}</strong></td>
                    <td>{o.payment_method}</td>
                    <td>
                      <Badge tone={o.channel === "IVR" ? "warning" : "brand"}>
                        {o.channel}
                      </Badge>
                    </td>
                    <td>
                      <span
                        className={`status-pill ${
                          o.status === "Delivered"
                            ? "status-deliv"
                            : o.status === "Preparing"
                            ? "status-prep"
                            : "status-new"
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td>
                      <select
                        style={{ fontSize: 10, padding: "3px 6px", borderRadius: 6, border: "1px solid #ccc" }}
                        value={o.status}
                        onChange={(e) => handleStatusChange(o.id, e.target.value)}
                      >
                        <option value="New">New</option>
                        <option value="Preparing">Preparing</option>
                        <option value="Delivered">Delivered</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: 24 }}>
                      No orders found for this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

// ==========================================
// 6. IVR ORDER DESK
// ==========================================
function IVRDashboard() {
  const [tab, setTab] = useState("All calls");
  const [calls, setCalls] = useState<IVROrder[]>([]);
  const [simulateModal, setSimulateModal] = useState(false);

  // Simulation form
  const [callerName, setCallerName] = useState("Demo Caller");
  const [callerPhone, setCallerPhone] = useState("00000 00009");
  const [spokenText, setSpokenText] = useState("2 Amul Milk and 1 Tata Salt packet urgently bhej do");
  const [language, setLanguage] = useState("Hindi");

  async function loadCalls() {
    try {
      const data = await getIVROrders(tab);
      setCalls(data);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    loadCalls();
  }, [tab]);

  async function handleConfirmCall(id: number) {
    try {
      const res = await confirmIVROrder(id);
      alert(res.message);
      loadCalls();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to confirm call order");
    }
  }

  async function handleSimulateSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await simulateIVRCall({
        caller_name: callerName,
        caller_phone: callerPhone,
        transcript: spokenText,
        language: language,
      });
      alert("Spoken call order transcribed and parsed successfully!");
      setSimulateModal(false);
      loadCalls();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Simulation failed");
    }
  }

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <div className="eyebrow"><Icon name="spark" size={14} /> AI-POWERED PHONE ORDERING</div>
          <h1>IVR Order Desk</h1>
          <p>Customer voice calls are transcribed and automatically parsed into confirmed store orders.</p>
        </div>
        <div className="heading-actions">
          <button className="primary-btn" onClick={() => setSimulateModal(true)}>
            <Icon name="phone" /> Simulate Incoming Voice Call
          </button>
          <a
            href={`tel:${STORE_IVR_NUMBER}`}
            className="ivr-number"
            style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}
            title="Click to dial store IVR line"
          >
            <span><Icon name="phone" /></span>
            <div>
              <small>YOUR SHOP ORDER LINE</small>
              <strong>{STORE_IVR_DISPLAY}</strong>
            </div>
            <Badge tone="success">Live IVR</Badge>
          </a>
        </div>
      </div>

      <div className="ivr-stats">
        <MetricCard icon="phone" label="CALLS TODAY" value="34" change="+6 today" />
        <MetricCard icon="orders" label="ORDERS CREATED" value={String(calls.length)} change="38% convert" tone="purple" />
        <MetricCard icon="clock" label="AVG. CALL TIME" value="1m 45s" change="-18 sec" tone="orange" />
        <MetricCard icon="spark" label="ORDER VALUE" value="₹6,840" change="+22.1%" tone="green" />
      </div>

      <div className="ivr-grid">
        <section className="card call-feed">
          <div className="card-head">
            <div>
              <h2>Live call activity</h2>
              <p>AI speech-to-text transcriptions</p>
            </div>
            <span className="listening"><i /> Listening</span>
          </div>

          <div className="tabs line-tabs">
            {["All calls", "Needs review", "Confirmed"].map((x) => (
              <button
                key={x}
                className={tab === x ? "active" : ""}
                onClick={() => setTab(x)}
              >
                {x}
              </button>
            ))}
          </div>

          {calls.map((c) => (
            <div className="call-row" key={c.id}>
              <span className="call-avatar">
                {c.caller_name.slice(0, 2).toUpperCase()}
              </span>
              <div className="call-info">
                <div>
                  <strong>{c.caller_name}</strong>
                  <small>
                    <Icon name="clock" size={12} /> {c.caller_phone} · {c.language}
                  </small>
                </div>
                <p>“{c.transcript}”</p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                  {(c.parsed_items || []).map((it, idx) => (
                    <span key={idx} style={{ background: "#f0f0f8", padding: "2px 6px", borderRadius: 4, fontSize: 9 }}>
                      {it.qty}x {it.name} ({rupee(it.price * it.qty)})
                    </span>
                  ))}
                </div>
              </div>
              <div className="call-result">
                <Badge tone={c.status === "Confirmed" ? "success" : "warning"}>
                  {c.status}
                </Badge>
                <strong>{rupee(c.total_amount)}</strong>
                {c.status !== "Confirmed" && (
                  <button
                    className="action-btn-sm success"
                    onClick={() => handleConfirmCall(c.id)}
                  >
                    Confirm & Bill
                  </button>
                )}
              </div>
            </div>
          ))}
          {calls.length === 0 && (
            <p style={{ padding: 24, textAlign: "center", color: "#888" }}>No IVR calls recorded yet.</p>
          )}
        </section>

        <aside className="card ivr-flow">
          <div className="card-head">
            <div>
              <h2>How IVR works</h2>
              <p>Voice-to-inventory pipeline</p>
            </div>
          </div>
          {[
            ["phone", "Customer calls order line", "In Hindi, English, Kannada"],
            ["spark", "AI transcribes & matches", "Maps spoken words to products"],
            ["check", "One-click confirmation", "Creates bill & notifies counter"],
            ["sync", "Inventory syncs instantly", "Stock decrements automatically"],
          ].map((x, i) => (
            <div className="flow-step" key={x[1]}>
              <span className="flow-number">{i + 1}</span>
              <span className={`flow-icon f${i}`}><Icon name={x[0] as IconName} /></span>
              <p>
                <strong>{x[1]}</strong>
                <small>{x[2]}</small>
              </p>
              {i < 3 && <i className="flow-line" />}
            </div>
          ))}
        </aside>
      </div>

      {/* Simulator Modal */}
      {simulateModal && (
        <div className="modal-backdrop" onMouseDown={() => setSimulateModal(false)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSimulateModal(false)}>×</button>
            <Badge tone="brand">IVR SIMULATOR</Badge>
            <h2>Simulate Voice Order</h2>
            <p>Dialing Store IVR Line: <b>{STORE_IVR_DISPLAY}</b> · Speech-to-order processing</p>
            <form onSubmit={handleSimulateSubmit}>
              <label>
                Caller Name
                <input
                  value={callerName}
                  onChange={(e) => setCallerName(e.target.value)}
                  required
                />
              </label>
              <label>
                Caller Phone
                <input
                  value={callerPhone}
                  onChange={(e) => setCallerPhone(e.target.value)}
                  required
                />
              </label>
              <label>
                Spoken Sentence (Transcript)
                <textarea
                  style={{ width: "100%", height: 75, padding: 8, borderRadius: 8, border: "1px solid #ddd", fontSize: 11 }}
                  value={spokenText}
                  onChange={(e) => setSpokenText(e.target.value)}
                  required
                />
              </label>
              <label>
                Language
                <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                  <option>Hindi</option>
                  <option>English</option>
                  <option>Kannada</option>
                </select>
              </label>
              <button className="primary-btn full" type="submit">
                Submit Voice Call
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 7. AI & ANALYTICS (ML FORECAST + REORDER)
// ==========================================
function Analytics() {
  const [forecast, setForecast] = useState<MLForecastItem[]>([]);
  const [reorders, setReorders] = useState<MLReorderItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadMLData() {
    setLoading(true);
    try {
      const [fData, rData] = await Promise.all([
        getMLForecast(),
        getMLReorderRecommendations(),
      ]);
      setForecast(fData);
      setReorders(rData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMLData();
  }, []);

  async function handleApplyReorder(productId: number, qty: number) {
    try {
      await restockProduct(productId, Math.max(10, qty));
      alert(`Reorder of ${Math.max(10, qty)} units applied!`);
      loadMLData();
    } catch {
      alert("Failed to restock");
    }
  }

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <h1>AI Demand Forecast & Analytics</h1>
          <p>Powered by XGBoost Machine Learning Model running on FastAPI and PostgreSQL sales data.</p>
        </div>
      </div>

      <div className="report-hero">
        <span><Icon name="chart" size={28} /></span>
        <div>
          <small>XGBOOST PREDICTIVE ENGINE</small>
          <strong>Demand Forecasting v1.0</strong>
          <p>Model trained on 15,000+ historical sale records across 30 product lines</p>
        </div>
        <div className="sparkline">▂▃▂▄▅▄▆▅▇█</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
        <section className="card">
          <div className="card-head">
            <div>
              <h2>AI Reorder Recommendations</h2>
              <p>Items reaching critical reorder point</p>
            </div>
            <Badge tone="brand">XGBoost-v1</Badge>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>PRODUCT</th>
                  <th>CURRENT STOCK</th>
                  <th>REORDER POINT</th>
                  <th>SUGGESTED REORDER</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {reorders.slice(0, 8).map((r) => (
                  <tr key={r.product_id}>
                    <td>
                      <strong>{r.name}</strong>
                      <small style={{ display: "block", color: "#888" }}>{r.category}</small>
                    </td>
                    <td>{r.current_stock} units</td>
                    <td>{r.reorder_point} units</td>
                    <td>
                      <b style={{ color: "var(--brand)" }}>
                        {r.recommended_quantity || 15} units
                      </b>
                    </td>
                    <td>
                      <button
                        className="action-btn-sm primary"
                        onClick={() => handleApplyReorder(r.product_id, r.recommended_quantity || 15)}
                      >
                        Order Now
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card">
          <div className="card-head">
            <div>
              <h2>Daily Demand Predictions</h2>
              <p>Next-day expected customer consumption</p>
            </div>
            <Badge tone="success">ML Output</Badge>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>PRODUCT</th>
                  <th>PREDICTION DATE</th>
                  <th>EST. DAILY DEMAND</th>
                  <th>MODEL</th>
                </tr>
              </thead>
              <tbody>
                {forecast.slice(0, 8).map((f) => (
                  <tr key={f.product_id}>
                    <td>
                      <strong>{f.name}</strong>
                      <small style={{ display: "block", color: "#888" }}>{f.category}</small>
                    </td>
                    <td>{f.prediction_date}</td>
                    <td>
                      <strong style={{ color: "var(--green)" }}>
                        {f.predicted_quantity} units
                      </strong>
                    </td>
                    <td><small>{f.model_name}</small></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

// ==========================================
// 8. SUPPLIERS & PURCHASES
// ==========================================
function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<PurchaseOrder[]>([]);
  const [addSuppModal, setAddSuppModal] = useState(false);
  const [newPOModal, setNewPOModal] = useState(false);

  // Supplier form
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [phone, setPhone] = useState("");
  const [cat, setCat] = useState("Staples & Grains");

  // PO form
  const [poSupplierId, setPoSupplierId] = useState<number>(1);
  const [poAmount, setPoAmount] = useState("15000");
  const [poSummary, setPoSummary] = useState("10 cartons oil, 20 bags atta");

  async function loadData() {
    try {
      const [sData, pData] = await Promise.all([
        getSuppliers(),
        getPurchaseOrders(),
      ]);
      setSuppliers(sData);
      setPurchases(pData);
      if (sData.length > 0) setPoSupplierId(sData[0].id);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleAddSupplier(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createSupplier({
        name,
        contact_person: contact,
        phone,
        category: cat,
      });
      alert("Supplier added successfully!");
      setAddSuppModal(false);
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to add supplier");
    }
  }

  async function handleCreatePO(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createPurchaseOrder({
        supplier_id: poSupplierId,
        total_amount: Number(poAmount),
        items_summary: poSummary,
      });
      alert("Purchase order issued!");
      setNewPOModal(false);
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to issue PO");
    }
  }

  async function handleMarkReceived(id: number) {
    try {
      await updatePurchaseOrderStatus(id, "Received");
      alert("Marked as Received!");
      loadData();
    } catch {
      alert("Failed to update status");
    }
  }

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <h1>Suppliers & Purchase Orders</h1>
          <p>Manage vendors, wholesale replenishments, and incoming supply deliveries.</p>
        </div>
        <div className="heading-actions">
          <button className="secondary-btn" onClick={() => setAddSuppModal(true)}>
            <Icon name="plus" /> Add Supplier
          </button>
          <button className="primary-btn" onClick={() => setNewPOModal(true)}>
            <Icon name="truck" /> New Purchase Order
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 14 }}>
        <section className="card">
          <div className="card-head">
            <div>
              <h2>Approved Suppliers</h2>
              <p>Wholesale partners</p>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>SUPPLIER</th>
                  <th>PHONE</th>
                  <th>CATEGORY</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <strong>{s.name}</strong>
                      <small style={{ display: "block", color: "#888" }}>{s.contact_person}</small>
                    </td>
                    <td>{s.phone}</td>
                    <td><Badge tone="neutral">{s.category}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card">
          <div className="card-head">
            <div>
              <h2>Recent Purchase Orders</h2>
              <p>Deliveries and status</p>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>PO #</th>
                  <th>SUPPLIER</th>
                  <th>TOTAL</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((po) => (
                  <tr key={po.id}>
                    <td><strong>{po.po_number}</strong></td>
                    <td>{po.supplier_name}</td>
                    <td><strong>{rupee(po.total_amount)}</strong></td>
                    <td>
                      <Badge tone={po.status === "Received" ? "success" : "warning"}>
                        {po.status}
                      </Badge>
                    </td>
                    <td>
                      {po.status !== "Received" && (
                        <button
                          className="action-btn-sm success"
                          onClick={() => handleMarkReceived(po.id)}
                        >
                          Mark Received
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Add Supplier Modal */}
      {addSuppModal && (
        <div className="modal-backdrop" onMouseDown={() => setAddSuppModal(false)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setAddSuppModal(false)}>×</button>
            <Badge tone="brand">VENDOR DIRECTORY</Badge>
            <h2>Add Supplier</h2>
            <form onSubmit={handleAddSupplier}>
              <label>
                Company / Supplier Name
                <input required value={name} onChange={(e) => setName(e.target.value)} />
              </label>
              <label>
                Contact Person
                <input value={contact} onChange={(e) => setContact(e.target.value)} />
              </label>
              <label>
                Phone Number
                <input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </label>
              <label>
                Category
                <input value={cat} onChange={(e) => setCat(e.target.value)} />
              </label>
              <button className="primary-btn full" type="submit">
                Save Supplier
              </button>
            </form>
          </div>
        </div>
      )}

      {/* New Purchase Order Modal */}
      {newPOModal && (
        <div className="modal-backdrop" onMouseDown={() => setNewPOModal(false)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setNewPOModal(false)}>×</button>
            <Badge tone="brand">PURCHASE ORDER</Badge>
            <h2>Create Purchase Order</h2>
            <form onSubmit={handleCreatePO}>
              <label>
                Select Supplier
                <select
                  value={poSupplierId}
                  onChange={(e) => setPoSupplierId(Number(e.target.value))}
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </label>
              <label>
                Total Order Value (₹)
                <input
                  type="number"
                  required
                  value={poAmount}
                  onChange={(e) => setPoAmount(e.target.value)}
                />
              </label>
              <label>
                Items Summary
                <textarea
                  style={{ width: "100%", height: 60, padding: 8, borderRadius: 8, border: "1px solid #ddd" }}
                  value={poSummary}
                  onChange={(e) => setPoSummary(e.target.value)}
                />
              </label>
              <button className="primary-btn full" type="submit">
                Issue Purchase Order
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 9. CUSTOMERS DIRECTORY
// ==========================================
function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [addCustModal, setAddCustModal] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  async function loadCustomers() {
    try {
      const data = await getCustomers();
      setCustomers(data);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  async function handleAddCustomer(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createCustomer({ name, phone, address });
      alert("Customer registered!");
      setAddCustModal(false);
      setName("");
      setPhone("");
      loadCustomers();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to add customer");
    }
  }

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <h1>Customer Directory</h1>
          <p>Know your neighborhood regulars, track total spend and udhaar balance.</p>
        </div>
        <button className="primary-btn" onClick={() => setAddCustModal(true)}>
          <Icon name="plus" /> Add Customer
        </button>
      </div>

      <section className="card table-card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>CUSTOMER</th>
                <th>PHONE</th>
                <th>LOCALITY</th>
                <th>TOTAL ORDERS</th>
                <th>TOTAL PURCHASES</th>
                <th>UDHAAR BALANCE</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <span className="avatar blue">
                        {c.name.slice(0, 2).toUpperCase()}
                      </span>
                      <strong>{c.name}</strong>
                    </div>
                  </td>
                  <td>{c.phone}</td>
                  <td>{c.address || "Bengaluru"}</td>
                  <td><strong>{c.orders_count}</strong></td>
                  <td><strong>{rupee(c.total_purchases)}</strong></td>
                  <td>
                    <Badge tone={Number(c.current_balance) > 0 ? "warning" : "success"}>
                      {rupee(c.current_balance)}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {addCustModal && (
        <div className="modal-backdrop" onMouseDown={() => setAddCustModal(false)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setAddCustModal(false)}>×</button>
            <Badge tone="brand">NEW CUSTOMER</Badge>
            <h2>Add Customer</h2>
            <form onSubmit={handleAddCustomer}>
              <label>
                Full Name
                <input required value={name} onChange={(e) => setName(e.target.value)} />
              </label>
              <label>
                Phone Number
                <input required value={phone} onChange={(e) => setPhone(e.target.value)} />
              </label>
              <label>
                Address
                <input value={address} onChange={(e) => setAddress(e.target.value)} />
              </label>
              <button className="primary-btn full" type="submit">
                Save Customer
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 10. MOBILE APP PREVIEW
// ==========================================
function MobilePreview() {
  const [screen, setScreen] = useState("Home");
  const [cart, setCart] = useState(0);

  const views: Record<string, React.ReactNode> = {
    Home: (
      <>
        <div className="mobile-greeting">
          <div>
            <small>Namaste</small>
            <h2>Store Owner ji</h2>
          </div>
          <button><Icon name="bell" /></button>
        </div>
        <div className="mobile-sales">
          <small>TODAY’S SALES</small>
          <strong>₹28,460</strong>
          <span>↑ 12.5%</span>
          <div>
            <p>Orders<b>86</b></p>
            <p>Profit<b>₹6,820</b></p>
          </div>
        </div>
        <div className="quick-title">
          <h3>Quick actions</h3>
        </div>
        <div className="quick-grid">
          <button onClick={() => setScreen("Billing")}>
            <span><Icon name="bill" /></span>New bill
          </button>
          <button onClick={() => setScreen("Home")}>
            <span><Icon name="wallet" /></span>Udhaar
          </button>
          <button onClick={() => setScreen("Home")}>
            <span><Icon name="users" /></span>Customer
          </button>
          <button onClick={() => setScreen("Billing")}>
            <span><Icon name="box" /></span>Stock
          </button>
        </div>
        <div className="mobile-alert">
          <span><Icon name="warning" /></span>
          <p>
            <strong>5 items low in stock</strong>
            <small>Review before they run out</small>
          </p>
          <Icon name="chevron" />
        </div>
        <h3 className="recent-title">
          Recent orders <button>View all</button>
        </h3>
        {["#2047 · UPI", "#2046 · Cash", "#2045 · Udhaar"].map((x, i) => (
          <div className="mobile-order" key={x}>
            <span className="order-check"><Icon name="check" size={14} /></span>
            <p>
              <strong>{x}</strong>
              <small>{10 - i * 7} mins ago</small>
            </p>
            <b>{["₹648", "₹285", "₹1,120"][i]}</b>
          </div>
        ))}
      </>
    ),
    Billing: (
      <>
        <div className="mobile-page-head">
          <button onClick={() => setScreen("Home")}>‹</button>
          <h2>Mobile POS</h2>
          <span>#SS-2048</span>
        </div>
        <div className="mobile-search">
          <Icon name="search" />
          <span>Search products...</span>
          <button><Icon name="scan" /></button>
        </div>
        <div className="mobile-categories">
          <button className="active">All</button>
          <button>Dairy</button>
          <button>Staples</button>
        </div>
        <div className="mobile-products">
          {[
            { id: 1, name: "Amul Milk 500ml", price: 33 },
            { id: 2, name: "Fortune Sunflower Oil 1L", price: 145 },
            { id: 3, name: "Tata Salt 1kg", price: 28 },
          ].map((p) => (
            <div key={p.id}>
              <ProductThumb name={p.name} small />
              <p>
                <strong>{p.name}</strong>
                <small>Ready stock</small>
                <b>{rupee(p.price)}</b>
              </p>
              <button onClick={() => setCart((c) => c + 1)}>
                {cart > 0 && p.id === 1 ? <span>{cart} in cart</span> : <Icon name="plus" size={16} />}
              </button>
            </div>
          ))}
        </div>
        {cart > 0 && (
          <button className="mobile-cart" onClick={() => alert("Mobile checkout complete!")}>
            <span>
              <b>{cart} items in bill</b>
              <small>Tap to complete</small>
            </span>
            <strong>{rupee(33 * cart)} <Icon name="arrow" /></strong>
          </button>
        )}
      </>
    ),
  };

  return (
    <div className="mobile-demo-page">
      <div className="mobile-copy">
        <Badge tone="brand">KIRANAONE COMPANION APP</Badge>
        <h1>Your entire shop,<br />right in your pocket.</h1>
        <p>
          Bill faster from anywhere in the store, manage customer udhaar, check stock, and receive voice order alerts on the go.
        </p>
        <ul>
          <li><Icon name="check" /> 3-tap fast counter billing</li>
          <li><Icon name="check" /> Live inventory and PostgreSQL synchronization</li>
          <li><Icon name="check" /> Hindi, Kannada and regional language ready</li>
        </ul>
        <div className="sync-demo">
          <Icon name="sync" />
          <span>
            <strong>Connected to Node.js backend</strong>
            <small>Active sync with local store database</small>
          </span>
          <Badge tone="success">Synced</Badge>
        </div>
      </div>

      <div className="phone-shell">
        <div className="phone-top">
          <span>9:41</span>
          <i />
          <span>● ●</span>
        </div>
        <div className="phone-screen">{views[screen] || views.Home}</div>
        <nav className="mobile-nav">
          {["Home", "Billing", "Udhaar", "Customers"].map((x) => (
            <button
              key={x}
              className={screen === x ? "active" : ""}
              onClick={() => setScreen(x === "Billing" ? "Billing" : "Home")}
            >
              <Icon
                name={x === "Home" ? "grid" : x === "Billing" ? "bill" : x === "Udhaar" ? "wallet" : "users"}
                size={18}
              />
              <span>{x}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

// ==========================================
// 11. LANDING PAGE
// ==========================================
function Landing({
  enter,
  onOpenAuth,
}: {
  enter: () => void;
  onOpenAuth: () => void;
}) {
  return (
    <div className="landing">
      <header className="landing-nav">
        <Logo />
        <nav>
          <a href="#solution">Platform</a>
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
        </nav>
        <div>
          <button className="login-btn" onClick={onOpenAuth}>Log in / Register</button>
          <button className="primary-btn" onClick={enter}>
            Open dashboard <Icon name="arrow" />
          </button>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <Badge tone="brand"><Icon name="spark" size={13} /> BUILT FOR BHARAT’S SHOPKEEPERS</Badge>
            <h1>Your Local Shop.<br /><span>Now Digitally Powered.</span></h1>
            <p>One unified platform to manage billing, stock, udhaar and customer orders—from web, mobile, or even phone calls with AI.</p>
            <div className="hero-actions">
              <button className="hero-primary" onClick={onOpenAuth}>
                Sign up / Log in <Icon name="arrow" />
              </button>
              <button className="hero-secondary" onClick={enter}>
                <span><Icon name="bill" /></span> See live dashboard
              </button>
            </div>
            <div className="proof">
              <span className="proof-avatars"><i>RS</i><i>MG</i><i>PN</i></span>
              <span>
                <strong>500+ local shops</strong>
                <small>already growing with KiranaOne</small>
              </span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="photo-wrap">
              <img
                src="https://images.unsplash.com/photo-1739066598279-1297113f5c6a?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1080"
                alt="A well-stocked local Indian kirana storefront"
              />
              <div className="photo-overlay" />
              <div className="floating-sale">
                <span><Icon name="chart" /></span>
                <p>
                  <small>TODAY’S SALES</small>
                  <strong>₹28,460</strong>
                  <b>↑ 12.5%</b>
                </p>
              </div>
              <div className="floating-order">
                <span><Icon name="phone" /></span>
                <p>
                  <strong>Call IVR: {STORE_IVR_DISPLAY}</strong>
                  <small>Auto voice ordering active</small>
                </p>
                <i><Icon name="check" /></i>
              </div>
            </div>
          </div>
        </section>

        <section className="connected" id="solution">
          <p>ONE CONNECTED PLATFORM</p>
          <h2>Every way you work. Finally in sync.</h2>
          <div className="system-flow">
            <div>
              <span><Icon name="globe" size={25} /></span>
              <strong>WEB DASHBOARD</strong>
              <small>Manage & grow</small>
            </div>
            <i /><b>+</b><i />
            <div>
              <span><Icon name="mobile" size={25} /></span>
              <strong>MOBILE POS</strong>
              <small>Counter billing</small>
            </div>
            <i /><b>+</b><i />
            <div>
              <span><Icon name="phone" size={25} /></span>
              <strong>AI IVR DESK</strong>
              <small>Take phone orders</small>
            </div>
            <i /><b>→</b><i />
            <div className="one-shop">
              <span><Icon name="store" size={25} /></span>
              <strong>ONE SHOP</strong>
              <small>Always in sync</small>
            </div>
          </div>
        </section>

        <section className="features" id="features">
          <div className="section-title">
            <Badge tone="brand">THE SOLUTION</Badge>
            <h2>Everything your shop needs.<br />Nothing it doesn’t.</h2>
            <p>Simple enough for day one. Powerful enough for your next ten stores.</p>
          </div>
          <div className="feature-grid">
            {[
              ["bill", "Lightning-fast billing", "Create a complete bill in seconds with live stock checks and UPI, Cash, Card or Udhaar."],
              ["box", "Smart inventory", "Know what’s in stock, what’s running low and what to reorder before customers ask."],
              ["wallet", "Digital khata", "Track every credit sale and payment. Send polite WhatsApp reminders without awkward calls."],
              ["phone", "Orders by phone", "AI understands customer calls, transcribes items and updates stock automatically."],
              ["users", "Customer relationships", "Remember purchase history and serve every regular neighborhood customer better."],
              ["chart", "AI Demand Forecasting", "Machine learning predictions powered by XGBoost to optimize reordering."],
            ].map((f, i) => (
              <article key={f[1]}>
                <span className={`feature-icon c${i}`}><Icon name={f[0] as IconName} /></span>
                <h3>{f[1]}</h3>
                <p>{f[2]}</p>
                <a onClick={enter}>Explore feature <Icon name="arrow" size={15} /></a>
              </article>
            ))}
          </div>
        </section>

        <section className="cta">
          <span className="cta-icon"><Icon name="store" size={30} /></span>
          <h2>Your shop already has the trust.<br />Now give it the tools.</h2>
          <p>Join hundreds of local retailers building a stronger, smarter business.</p>
          <button onClick={onOpenAuth}>
            Get Started Free / Log In <Icon name="arrow" />
          </button>
        </section>
      </main>

      <footer>
        <Logo />
        <p>Made for India’s neighborhood retailers and grocery store owners.</p>
        <span>© 2026 KiranaOne</span>
      </footer>
    </div>
  );
}

// ==========================================
// MAIN APP COMPONENT
// ==========================================
export default function App() {
  const [page, setPage] = useState("dashboard");
  const [currentUser, setCurrentUser] = useState<User | null>(() => getStoredUser());
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    // Attempt to verify session or load user on initial mount
    fetchCurrentUser().then((u) => {
      if (u) setCurrentUser(u);
    });
  }, []);

  function handleLogout() {
    clearSession();
    setCurrentUser(null);
    setAuthModalOpen(true);
  }

  const content = useMemo(() => {
    switch (page) {
      case "dashboard":
        return <Dashboard navigate={setPage} currentUser={currentUser} />;
      case "billing":
        return <Billing />;
      case "inventory":
        return <Inventory />;
      case "customers":
        return <CustomersPage />;
      case "udhaar":
        return <Udhaar />;
      case "suppliers":
        return <Suppliers />;
      case "orders":
        return <OrdersDesk />;
      case "ivr":
        return <IVRDashboard />;
      case "analytics":
        return <Analytics />;
      case "mobile":
        return <MobilePreview />;
      default:
        return <Dashboard navigate={setPage} currentUser={currentUser} />;
    }
  }, [page, currentUser]);

  if (page === "landing") {
    return (
      <>
        <Landing enter={() => setPage("dashboard")} onOpenAuth={() => setAuthModalOpen(true)} />
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={(u) => {
            setCurrentUser(u);
            setPage("dashboard");
          }}
        />
      </>
    );
  }

  return (
    <>
      <AppShell
        page={page}
        setPage={setPage}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenAuth={() => setAuthModalOpen(true)}
      >
        {content}
      </AppShell>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(u) => {
          setCurrentUser(u);
        }}
      />
    </>
  );
}
