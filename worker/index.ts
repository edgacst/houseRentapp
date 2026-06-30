import { Hono } from "hono";
import { cors } from "hono/cors";
import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";

type Env = {
  DB: D1Database;
  JWT_SECRET: string;
  ASSETS: Fetcher;
};

type Variables = {
  userId: string;
};

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

app.use("/api/*", cors());

const jsonArray = (value: unknown) => JSON.stringify(value ?? []);
const parseArray = (value: unknown) => {
  if (!value || typeof value !== "string") return [];
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
};
const id = () => crypto.randomUUID();
const now = () => new Date().toISOString();
const secret = (value: string) => new TextEncoder().encode(value);
const publicUser = (user: any) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  status: user.status,
});

async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" }, key, 256);
  return `pbkdf2$${btoa(String.fromCharCode(...salt))}$${btoa(String.fromCharCode(...new Uint8Array(bits)))}`;
}

async function verifyPassword(password: string, stored: string) {
  const [, salt64, hash64] = stored.split("$");
  if (!salt64 || !hash64) return false;
  const salt = Uint8Array.from(atob(salt64), (c) => c.charCodeAt(0));
  const expected = Uint8Array.from(atob(hash64), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" }, key, 256);
  const actual = new Uint8Array(bits);
  return expected.length === actual.length && expected.every((byte, index) => byte === actual[index]);
}

async function signToken(userId: string, jwtSecret: string) {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret(jwtSecret));
}

async function auth(c: any, next: any) {
  const header = c.req.header("Authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return c.json({ message: "로그인이 필요합니다." }, 401);
  try {
    const { payload } = await jwtVerify(token, secret(c.env.JWT_SECRET));
    c.set("userId", String(payload.userId));
    await next();
  } catch {
    return c.json({ message: "인증 정보가 올바르지 않습니다." }, 401);
  }
}

async function one(c: any, sql: string, ...params: unknown[]) {
  return c.env.DB.prepare(sql).bind(...params).first();
}

async function all(c: any, sql: string, ...params: unknown[]) {
  return (await c.env.DB.prepare(sql).bind(...params).all()).results;
}

async function exec(c: any, sql: string, ...params: unknown[]) {
  return c.env.DB.prepare(sql).bind(...params).run();
}

const registerSchema = z.object({ name: z.string().min(1), email: z.string().email(), password: z.string().min(8) });
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

app.get("/api/health", (c) => c.json({ ok: true, service: "houserent-worker-api" }));

app.post("/api/auth/register", async (c) => {
  const data = registerSchema.parse(await c.req.json());
  const exists = await one(c, "SELECT id FROM users WHERE email = ?", data.email);
  if (exists) return c.json({ message: "이미 가입된 이메일입니다." }, 409);
  const user = { id: id(), email: data.email, name: data.name, role: "user", status: "active" };
  await exec(c, "INSERT INTO users (id,email,passwordHash,name,role,status,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?)", user.id, user.email, await hashPassword(data.password), user.name, user.role, user.status, now(), now());
  return c.json({ user, token: await signToken(user.id, c.env.JWT_SECRET) }, 201);
});

app.post("/api/auth/login", async (c) => {
  const data = loginSchema.parse(await c.req.json());
  const user = await one(c, "SELECT * FROM users WHERE email = ?", data.email);
  if (!user || !(await verifyPassword(data.password, String(user.passwordHash)))) {
    return c.json({ message: "이메일 또는 비밀번호를 확인하세요." }, 401);
  }
  return c.json({ user: publicUser(user), token: await signToken(String(user.id), c.env.JWT_SECRET) });
});

app.post("/api/auth/password-reset", async (c) => {
  const { email } = z.object({ email: z.string().email() }).parse(await c.req.json());
  const user = await one(c, "SELECT id FROM users WHERE email = ?", email);
  if (!user) return c.json({ message: "가입된 이메일을 찾을 수 없습니다." }, 404);
  const temporaryPassword = Math.random().toString(36).slice(2, 10);
  await exec(c, "UPDATE users SET passwordHash = ?, updatedAt = ? WHERE id = ?", await hashPassword(temporaryPassword), now(), user.id);
  return c.json({ temporaryPassword });
});

app.get("/api/me", auth, async (c) => {
  const user = await one(c, "SELECT id,email,name,role,status FROM users WHERE id = ?", c.get("userId"));
  if (!user) return c.json({ message: "사용자를 찾을 수 없습니다." }, 404);
  return c.json(publicUser(user));
});

app.put("/api/me", auth, async (c) => {
  const data = z.object({ name: z.string().min(1), email: z.string().email() }).parse(await c.req.json());
  await exec(c, "UPDATE users SET name = ?, email = ?, updatedAt = ? WHERE id = ?", data.name, data.email, now(), c.get("userId"));
  return c.json(publicUser(await one(c, "SELECT id,email,name,role,status FROM users WHERE id = ?", c.get("userId"))));
});

app.put("/api/me/password", auth, async (c) => {
  const data = z.object({ currentPassword: z.string().min(1), nextPassword: z.string().min(8) }).parse(await c.req.json());
  const user = await one(c, "SELECT passwordHash FROM users WHERE id = ?", c.get("userId"));
  if (!user || !(await verifyPassword(data.currentPassword, String(user.passwordHash)))) {
    return c.json({ message: "현재 비밀번호가 올바르지 않습니다." }, 401);
  }
  await exec(c, "UPDATE users SET passwordHash = ?, updatedAt = ? WHERE id = ?", await hashPassword(data.nextPassword), now(), c.get("userId"));
  return c.body(null, 204);
});

async function adminOnly(c: any, next: any) {
  const user = await one(c, "SELECT role FROM users WHERE id = ?", c.get("userId"));
  if (!user || user.role !== "admin") {
    return c.json({ message: "관리자 권한이 필요합니다." }, 403);
  }
  await next();
}

async function adminSummary(c: any, userId: string) {
  const user = await one(c, "SELECT id,email,name,role,status,createdAt FROM users WHERE id = ?", userId);
  if (!user) return null;
  const [properties, rooms, tenants, contracts, rentPayments, expenses] = await Promise.all([
    one(c, "SELECT COUNT(*) AS count FROM properties WHERE userId = ?", userId),
    one(c, "SELECT COUNT(*) AS count FROM rooms WHERE userId = ?", userId),
    one(c, "SELECT COUNT(*) AS count FROM tenants WHERE userId = ?", userId),
    one(c, "SELECT COUNT(*) AS count FROM contracts WHERE userId = ?", userId),
    one(c, "SELECT COUNT(*) AS count FROM rent_payments WHERE userId = ?", userId),
    one(c, "SELECT COUNT(*) AS count FROM expenses WHERE userId = ?", userId),
  ]);
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    createdAt: String(user.createdAt).slice(0, 10),
    counts: {
      properties: Number(properties?.count ?? 0),
      rooms: Number(rooms?.count ?? 0),
      tenants: Number(tenants?.count ?? 0),
      contracts: Number(contracts?.count ?? 0),
      rentPayments: Number(rentPayments?.count ?? 0),
      expenses: Number(expenses?.count ?? 0),
    },
  };
}

app.get("/api/admin/users", auth, adminOnly, async (c) => {
  const users = await all(c, "SELECT id FROM users ORDER BY createdAt DESC");
  return c.json(await Promise.all(users.map((user: any) => adminSummary(c, String(user.id)))));
});

app.put("/api/admin/users/:id", auth, adminOnly, async (c) => {
  const data = z.object({
    role: z.enum(["admin", "user"]),
    status: z.enum(["active", "suspended", "withdrawn"]),
  }).parse(await c.req.json());
  const result = await exec(c, "UPDATE users SET role = ?, status = ?, updatedAt = ? WHERE id = ?", data.role, data.status, now(), c.req.param("id"));
  if (result.meta.changes === 0) return c.json({ message: "회원을 찾을 수 없습니다." }, 404);
  return c.json(await adminSummary(c, c.req.param("id")));
});

app.put("/api/admin/users/:id/password", auth, adminOnly, async (c) => {
  const data = z.object({ password: z.string().min(8) }).parse(await c.req.json());
  const result = await exec(c, "UPDATE users SET passwordHash = ?, updatedAt = ? WHERE id = ?", await hashPassword(data.password), now(), c.req.param("id"));
  if (result.meta.changes === 0) return c.json({ message: "회원을 찾을 수 없습니다." }, 404);
  return c.body(null, 204);
});

function crud(table: string, schema: z.ZodTypeAny, toDb: (data: any, userId: string, recordId: string) => Record<string, unknown>, toApi = (row: any) => row) {
  app.get(`/api/${table}`, auth, async (c) => {
    const rows = await all(c, `SELECT * FROM ${table.replaceAll("-", "_")} WHERE userId = ? ORDER BY createdAt DESC`, c.get("userId"));
    return c.json(rows.map(toApi));
  });

  app.post(`/api/${table}`, auth, async (c) => {
    const data = schema.parse(await c.req.json());
    const record = toDb(data, c.get("userId"), id());
    const keys = Object.keys(record);
    await exec(c, `INSERT INTO ${table.replaceAll("-", "_")} (${keys.join(",")}) VALUES (${keys.map(() => "?").join(",")})`, ...keys.map((key) => record[key]));
    return c.json(toApi(record), 201);
  });

  app.put(`/api/${table}/:id`, auth, async (c) => {
    const data = schema.parse(await c.req.json());
    const record = toDb(data, c.get("userId"), c.req.param("id"));
    const keys = Object.keys(record).filter((key) => key !== "id" && key !== "userId" && key !== "createdAt");
    const result = await exec(c, `UPDATE ${table.replaceAll("-", "_")} SET ${keys.map((key) => `${key} = ?`).join(",")} WHERE id = ? AND userId = ?`, ...keys.map((key) => record[key]), c.req.param("id"), c.get("userId"));
    if (result.meta.changes === 0) return c.json({ message: "대상을 찾을 수 없습니다." }, 404);
    return c.json(toApi(await one(c, `SELECT * FROM ${table.replaceAll("-", "_")} WHERE id = ? AND userId = ?`, c.req.param("id"), c.get("userId"))));
  });

  app.delete(`/api/${table}/:id`, auth, async (c) => {
    const result = await exec(c, `DELETE FROM ${table.replaceAll("-", "_")} WHERE id = ? AND userId = ?`, c.req.param("id"), c.get("userId"));
    if (result.meta.changes === 0) return c.json({ message: "대상을 찾을 수 없습니다." }, 404);
    return c.body(null, 204);
  });
}

const propertySchema = z.object({
  name: z.string().min(1), address: z.string().min(1), type: z.string().min(1),
  imageName: z.string().optional(), imageData: z.string().optional(), imageNames: z.array(z.string()).optional(), imageDataList: z.array(z.string()).optional(),
  builtYear: z.number().optional(), totalFloors: z.number().optional(), hasElevator: z.boolean().optional(), parkingAvailable: z.boolean().optional(),
  managementType: z.string().optional(), managerName: z.string().optional(), managerPhone: z.string().optional(), memo: z.string().optional(),
  purchasePrice: z.number().optional(), acquisitionTax: z.number().optional(), brokerageFee: z.number().optional(), renovationCost: z.number().optional(), otherPurchaseCost: z.number().optional(), loanAmount: z.number().optional(),
  documentNames: z.array(z.string()).optional(), documentDataList: z.array(z.string()).optional(),
});

crud("properties", propertySchema, (d, userId, recordId) => ({
  id: recordId, userId, name: d.name, address: d.address, type: d.type, imageName: d.imageName ?? "", imageData: d.imageData ?? "",
  imageNames: jsonArray(d.imageNames), imageDataList: jsonArray(d.imageDataList), builtYear: d.builtYear ?? null, totalFloors: d.totalFloors ?? null,
  hasElevator: d.hasElevator ? 1 : 0, parkingAvailable: d.parkingAvailable ? 1 : 0, managementType: d.managementType ?? "", managerName: d.managerName ?? "", managerPhone: d.managerPhone ?? "", memo: d.memo ?? "",
  purchasePrice: d.purchasePrice ?? 0, acquisitionTax: d.acquisitionTax ?? 0, brokerageFee: d.brokerageFee ?? 0, renovationCost: d.renovationCost ?? 0, otherPurchaseCost: d.otherPurchaseCost ?? 0, loanAmount: d.loanAmount ?? 0,
  documentNames: jsonArray(d.documentNames), documentDataList: jsonArray(d.documentDataList), createdAt: now(), updatedAt: now(),
}), (r) => ({ ...r, hasElevator: Boolean(r.hasElevator), parkingAvailable: Boolean(r.parkingAvailable), imageNames: parseArray(r.imageNames), imageDataList: parseArray(r.imageDataList), documentNames: parseArray(r.documentNames), documentDataList: parseArray(r.documentDataList) }));

crud("rooms", z.object({
  propertyId: z.string(), name: z.string(), floor: z.number(), type: z.string(), status: z.string(), deposit: z.number(), monthlyRent: z.number(), maintenanceFee: z.number(), area: z.number(), memo: z.string().optional(),
}), (d, userId, recordId) => ({ id: recordId, userId, propertyId: d.propertyId, name: d.name, floor: d.floor, type: d.type, status: d.status, deposit: d.deposit, monthlyRent: d.monthlyRent, maintenanceFee: d.maintenanceFee, area: d.area, memo: d.memo ?? "", createdAt: now(), updatedAt: now() }));

crud("tenants", z.object({ name: z.string(), phone: z.string(), email: z.string().optional(), memo: z.string().optional() }),
  (d, userId, recordId) => ({ id: recordId, userId, name: d.name, phone: d.phone, email: d.email ?? "", memo: d.memo ?? "", createdAt: now(), updatedAt: now() }));

crud("contracts", z.object({
  propertyId: z.string(), roomId: z.string(), tenantId: z.string(), startDate: z.string(), endDate: z.string(), deposit: z.number(), monthlyRent: z.number(), maintenanceFee: z.number(), paymentDay: z.number(), status: z.string(), memo: z.string().optional(), attachmentName: z.string().optional(), attachmentData: z.string().optional(),
}), (d, userId, recordId) => ({ id: recordId, userId, propertyId: d.propertyId, roomId: d.roomId, tenantId: d.tenantId, startDate: d.startDate, endDate: d.endDate, deposit: d.deposit, monthlyRent: d.monthlyRent, maintenanceFee: d.maintenanceFee, paymentDay: d.paymentDay, status: d.status, memo: d.memo ?? "", attachmentName: d.attachmentName ?? "", attachmentData: d.attachmentData ?? "", createdAt: now(), updatedAt: now() }));

crud("rent-payments", z.object({
  contractId: z.string(), dueDate: z.string(), paidDate: z.string().optional(), rentAmount: z.number(), maintenanceFee: z.number(), status: z.string(), memo: z.string().optional(),
}), (d, userId, recordId) => ({ id: recordId, userId, contractId: d.contractId, dueDate: d.dueDate, paidDate: d.paidDate ?? "", rentAmount: d.rentAmount, maintenanceFee: d.maintenanceFee, status: d.status, memo: d.memo ?? "", createdAt: now(), updatedAt: now() }));

app.post("/api/rent-payments/generate-month", auth, async (c) => {
  const { month } = z.object({ month: z.string().regex(/^\d{4}-\d{2}$/) }).parse(await c.req.json());
  const contracts = await all(c, "SELECT * FROM contracts WHERE userId = ? AND status = 'active'", c.get("userId"));
  const created = [];
  for (const contract of contracts as any[]) {
    const dueDate = `${month}-${String(contract.paymentDay).padStart(2, "0")}`;
    const exists = await one(c, "SELECT id FROM rent_payments WHERE contractId = ? AND dueDate = ?", contract.id, dueDate);
    if (exists) continue;
    const payment = { id: id(), userId: c.get("userId"), contractId: contract.id, dueDate, paidDate: "", rentAmount: contract.monthlyRent, maintenanceFee: contract.maintenanceFee, status: "unpaid", memo: `${month} 자동 생성`, createdAt: now(), updatedAt: now() };
    await exec(c, "INSERT INTO rent_payments (id,userId,contractId,dueDate,paidDate,rentAmount,maintenanceFee,status,memo,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?)", ...Object.values(payment));
    created.push(payment);
  }
  return c.json({ createdCount: created.length, payments: created }, 201);
});

crud("maintenance-charges", z.object({
  propertyId: z.string(), roomId: z.string().optional(), title: z.string(), billingMonth: z.string(), dueDate: z.string(), amount: z.number(), status: z.string(), paidDate: z.string().optional(), memo: z.string().optional(),
}), (d, userId, recordId) => ({ id: recordId, userId, propertyId: d.propertyId, roomId: d.roomId ?? "", title: d.title, billingMonth: d.billingMonth, dueDate: d.dueDate, amount: d.amount, status: d.status, paidDate: d.paidDate ?? "", memo: d.memo ?? "", createdAt: now(), updatedAt: now() }));

crud("expenses", z.object({
  propertyId: z.string(), roomId: z.string().optional(), title: z.string(), category: z.string(), expenseDate: z.string(), amount: z.number(), vendor: z.string().optional(), memo: z.string().optional(), receiptName: z.string().optional(), receiptData: z.string().optional(),
}), (d, userId, recordId) => ({ id: recordId, userId, propertyId: d.propertyId, roomId: d.roomId ?? "", title: d.title, category: d.category, expenseDate: d.expenseDate, amount: d.amount, vendor: d.vendor ?? "", memo: d.memo ?? "", receiptName: d.receiptName ?? "", receiptData: d.receiptData ?? "", createdAt: now(), updatedAt: now() }));

app.notFound((c) => c.env.ASSETS.fetch(c.req.raw));

export default app;
