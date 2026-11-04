export const API_BASE_URL = "http://localhost:3000";

// --- Auth Types ---
export interface User {
  id: number;
  name: string;
  store_name: string;
  email: string;
  phone?: string;
  role: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

// Token & User Storage Helpers
export function getStoredToken(): string | null {
  return localStorage.getItem("kirana_token");
}

export function setStoredToken(token: string) {
  localStorage.setItem("kirana_token", token);
}

export function getStoredUser(): User | null {
  const data = localStorage.getItem("kirana_user");
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function setStoredUser(user: User) {
  localStorage.setItem("kirana_user", JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem("kirana_token");
  localStorage.removeItem("kirana_user");
}

function getAuthHeaders(): HeadersInit {
  const token = getStoredToken();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

// --- Auth API ---
export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Login failed");
  setStoredToken(data.token);
  setStoredUser(data.user);
  return data;
}

export async function registerUser(formData: {
  name: string;
  store_name: string;
  email: string;
  password: string;
  phone?: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Registration failed");
  setStoredToken(data.token);
  setStoredUser(data.user);
  return data;
}

export async function fetchCurrentUser(): Promise<User | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.user) setStoredUser(data.user);
    return data.user;
  } catch {
    return null;
  }
}

// --- Product Types & API ---
export interface ApiProduct {
  id: number;
  name: string;
  category: string | null;
  price: string | number;
  purchase_price: string | number;
  minimum_stock: number;
  current_stock: number;
  reorder_level: number;
  barcode?: string;
}

export async function getProducts(params?: {
  category?: string;
  search?: string;
  filter?: string;
}): Promise<ApiProduct[]> {
  const query = new URLSearchParams();
  if (params?.category) query.append("category", params.category);
  if (params?.search) query.append("search", params.search);
  if (params?.filter) query.append("filter", params.filter);

  const url = `${API_BASE_URL}/api/products${query.toString() ? `?${query.toString()}` : ""}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load products (${response.status})`);
  }
  return response.json();
}

export async function getProductByBarcode(code: string): Promise<ApiProduct> {
  const res = await fetch(`${API_BASE_URL}/api/products/barcode/${encodeURIComponent(code)}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Product not found with barcode ${code}`);
  }
  return res.json();
}

export async function getProductCategories(): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/api/products/categories`);
  if (!response.ok) return [];
  return response.json();
}

export async function createProduct(payload: {
  name: string;
  category: string;
  price: number;
  purchase_price?: number;
  initial_stock?: number;
  minimum_stock?: number;
  reorder_level?: number;
  barcode?: string;
}): Promise<{ message: string; product: ApiProduct }> {
  const res = await fetch(`${API_BASE_URL}/api/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to create product");
  return data;
}

export async function restockProduct(
  id: number,
  quantity: number
): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE_URL}/api/products/${id}/restock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quantity }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to restock");
  return data;
}

// --- Sales & Orders API ---
export interface OrderItem {
  id?: number;
  product_id: number;
  product_name?: string;
  quantity: number;
  unit_price: number;
}

export interface SaleOrder {
  id: number;
  sale_date: string;
  total_amount: string | number;
  customer_id?: number | null;
  customer_name: string;
  payment_method: string;
  channel: string;
  status: string;
  discount: string | number;
  created_at: string;
  items?: OrderItem[];
  items_count?: number;
}

export interface CreateSalePayload {
  customer_id?: number | null;
  customer_name?: string;
  payment_method: string;
  channel?: string;
  items: {
    product_id: number;
    quantity: number;
    unit_price: number;
  }[];
  discount?: number;
  total_amount?: number;
}

export async function createSale(
  payload: CreateSalePayload
): Promise<{ message: string; invoice_number: string; sale: SaleOrder }> {
  const res = await fetch(`${API_BASE_URL}/api/sales`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to complete sale");
  return data;
}

export async function getOrders(params?: {
  limit?: number;
  status?: string;
}): Promise<SaleOrder[]> {
  const query = new URLSearchParams();
  if (params?.limit) query.append("limit", params.limit.toString());
  if (params?.status) query.append("status", params.status);

  const res = await fetch(`${API_BASE_URL}/api/sales?${query.toString()}`);
  if (!res.ok) throw new Error("Failed to load orders");
  return res.json();
}

export async function updateOrderStatus(
  id: number,
  status: string
): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE_URL}/api/sales/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to update order status");
  return data;
}

export interface StoreStats {
  todaySales: number;
  todayOrders: number;
  profit: number;
  udhaarDue: number;
  lowStockCount: number;
  chartData: { day_label: string; sale_date: string; amount: string; count: string }[];
  topProducts: {
    id: number;
    name: string;
    category: string;
    price: string;
    total_sold: string;
    total_revenue: string;
  }[];
  stockAlerts: {
    id: number;
    name: string;
    category: string;
    price: string;
    current_stock: number;
    reorder_level: number;
  }[];
}

export async function getStoreStats(): Promise<StoreStats> {
  const res = await fetch(`${API_BASE_URL}/api/sales/stats`);
  if (!res.ok) throw new Error("Failed to load store statistics");
  return res.json();
}

// --- Udhaar & Customers API ---
export interface Customer {
  id: number;
  name: string;
  phone: string;
  address?: string;
  credit_limit: string | number;
  current_balance: string | number;
  total_purchases: string | number;
  orders_count: number;
  created_at: string;
}

export interface UdhaarTransaction {
  id: number;
  customer_id: number;
  type: "debit" | "credit";
  amount: string | number;
  payment_mode: string;
  notes: string;
  created_at: string;
}

export async function getCustomers(search?: string): Promise<Customer[]> {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  const res = await fetch(`${API_BASE_URL}/api/udhaar/customers${query}`);
  if (!res.ok) throw new Error("Failed to load customers");
  return res.json();
}

export async function createCustomer(payload: {
  name: string;
  phone: string;
  address?: string;
  credit_limit?: number;
  initial_balance?: number;
}): Promise<{ message: string; customer: Customer }> {
  const res = await fetch(`${API_BASE_URL}/api/udhaar/customers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to create customer");
  return data;
}

export async function getCustomerTransactions(
  customerId: number
): Promise<UdhaarTransaction[]> {
  const res = await fetch(
    `${API_BASE_URL}/api/udhaar/customers/${customerId}/transactions`
  );
  if (!res.ok) throw new Error("Failed to load customer transactions");
  return res.json();
}

export async function recordUdhaarPayment(payload: {
  customer_id: number;
  amount: number;
  payment_mode?: string;
  notes?: string;
}): Promise<{ message: string; customer: Customer }> {
  const res = await fetch(`${API_BASE_URL}/api/udhaar/payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to record payment");
  return data;
}

// --- IVR API ---
export const STORE_IVR_NUMBER = "01141187365";
export const STORE_IVR_DISPLAY = "01141187365";

export interface IVROrder {
  id: number;
  caller_name: string;
  caller_phone: string;
  transcript: string;
  parsed_items: {
    product_id: number;
    name: string;
    qty: number;
    price: number;
  }[];
  total_amount: string | number;
  status: string;
  language: string;
  created_at: string;
}

export async function getIVROrders(status?: string): Promise<IVROrder[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  const res = await fetch(`${API_BASE_URL}/api/ivr${query}`);
  if (!res.ok) throw new Error("Failed to load IVR orders");
  return res.json();
}

export async function simulateIVRCall(payload: {
  caller_name: string;
  caller_phone: string;
  transcript: string;
  language: string;
}): Promise<{ message: string; order: IVROrder }> {
  const res = await fetch(`${API_BASE_URL}/api/ivr/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to simulate IVR order");
  return data;
}

export async function confirmIVROrder(id: number): Promise<{ message: string; sale_id: number }> {
  const res = await fetch(`${API_BASE_URL}/api/ivr/${id}/confirm`, {
    method: "POST",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to confirm IVR order");
  return data;
}

// --- Suppliers API ---
export interface Supplier {
  id: number;
  name: string;
  contact_person?: string;
  phone?: string;
  category?: string;
  total_orders?: string | number;
  total_spent?: string | number;
}

export interface PurchaseOrder {
  id: number;
  po_number: string;
  supplier_id: number;
  supplier_name: string;
  total_amount: string | number;
  status: string;
  items_summary: string;
  created_at: string;
}

export async function getSuppliers(): Promise<Supplier[]> {
  const res = await fetch(`${API_BASE_URL}/api/suppliers`);
  if (!res.ok) throw new Error("Failed to load suppliers");
  return res.json();
}

export async function createSupplier(payload: {
  name: string;
  contact_person?: string;
  phone?: string;
  category?: string;
}): Promise<{ message: string; supplier: Supplier }> {
  const res = await fetch(`${API_BASE_URL}/api/suppliers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to create supplier");
  return data;
}

export async function getPurchaseOrders(): Promise<PurchaseOrder[]> {
  const res = await fetch(`${API_BASE_URL}/api/suppliers/purchases`);
  if (!res.ok) throw new Error("Failed to load purchase orders");
  return res.json();
}

export async function createPurchaseOrder(payload: {
  supplier_id: number;
  total_amount: number;
  items_summary?: string;
  po_number?: string;
}): Promise<{ message: string; purchase_order: PurchaseOrder }> {
  const res = await fetch(`${API_BASE_URL}/api/suppliers/purchases`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to create purchase order");
  return data;
}

export async function updatePurchaseOrderStatus(
  id: number,
  status: string
): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE_URL}/api/suppliers/purchases/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to update PO status");
  return data;
}

// --- ML Intelligence API ---
export interface MLForecastItem {
  product_id: number;
  name: string;
  category: string;
  price: string | number;
  prediction_date: string;
  predicted_quantity: number;
  model_name: string;
}

export interface MLReorderItem {
  product_id: number;
  name: string;
  category: string;
  price: string | number;
  prediction_date: string;
  predicted_quantity: number;
  current_stock: number;
  reorder_level: number;
  reorder_point: number;
  reorder_required: boolean;
  recommended_quantity: number;
  model_name: string;
}

export async function getMLForecast(): Promise<MLForecastItem[]> {
  const res = await fetch(`${API_BASE_URL}/api/ml/forecast`);
  if (!res.ok) throw new Error("Failed to load ML forecast");
  const data = await res.json();
  return data.data || [];
}

export async function getMLReorderRecommendations(): Promise<MLReorderItem[]> {
  const res = await fetch(`${API_BASE_URL}/api/ml/reorder`);
  if (!res.ok) throw new Error("Failed to load ML reorders");
  const data = await res.json();
  return data.data || [];
}
