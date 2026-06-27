import cors from "cors";
import "dotenv/config";
import express from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { requireAuth, signToken } from "./auth.js";
import {
  toApiContract,
  toApiMaintenanceCharge,
  toApiProperty,
  toApiRentPayment,
  toApiRoom,
  toApiTenant,
  toDbContractStatus,
  toDbMaintenanceStatus,
  toDbPropertyType,
  toDbRentStatus,
  toDbRoomStatus,
  toDbRoomType,
} from "./mappers.js";
import { prisma } from "./prisma.js";

const app = express();
const port = Number(process.env.API_PORT ?? 4000);

app.use(cors());
app.use(express.json({ limit: "50mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "houserent-api" });
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

app.post("/api/auth/register", async (req, res) => {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ message: "입력값을 확인하세요." });

  const exists = await prisma.user.findUnique({
    where: { email: result.data.email },
  });
  if (exists) return res.status(409).json({ message: "이미 가입된 이메일입니다." });

  const user = await prisma.user.create({
    data: {
      email: result.data.email,
      name: result.data.name,
      passwordHash: await bcrypt.hash(result.data.password, 12),
    },
  });

  res.status(201).json({
    token: signToken(user.id),
    user: { id: user.id, email: user.email, name: user.name },
  });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

app.post("/api/auth/login", async (req, res) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ message: "입력값을 확인하세요." });

  const user = await prisma.user.findUnique({
    where: { email: result.data.email },
  });
  const ok = user
    ? await bcrypt.compare(result.data.password, user.passwordHash)
    : false;
  if (!user || !ok) {
    return res.status(401).json({ message: "이메일 또는 비밀번호가 올바르지 않습니다." });
  }

  res.json({
    token: signToken(user.id),
    user: { id: user.id, email: user.email, name: user.name },
  });
});

app.get("/api/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, email: true, name: true },
  });
  res.json(user);
});

const updateMeSchema = z.object({
  name: z.string().min(1),
});

app.put("/api/me", requireAuth, async (req, res) => {
  const result = updateMeSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ message: "이름을 입력하세요." });

  const user = await prisma.user.update({
    where: { id: req.userId },
    data: { name: result.data.name },
    select: { id: true, email: true, name: true },
  });
  res.json(user);
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  nextPassword: z.string().min(8),
});

app.put("/api/me/password", requireAuth, async (req, res) => {
  const result = passwordSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ message: "비밀번호는 8자 이상이어야 합니다." });

  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });

  const ok = await bcrypt.compare(result.data.currentPassword, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "현재 비밀번호가 올바르지 않습니다." });

  await prisma.user.update({
    where: { id: req.userId },
    data: { passwordHash: await bcrypt.hash(result.data.nextPassword, 12) },
  });
  res.status(204).send();
});

const propertySchema = z
  .object({
    name: z.string().min(1),
    address: z.string().min(1),
    type: z.enum(["오피스텔", "빌라", "상가", "아파트", "원룸"]),
    imageName: z.string().optional(),
    imageData: z.string().optional(),
    imageNames: z.array(z.string()).max(5).optional(),
    imageDataList: z.array(z.string()).max(5).optional(),
    builtYear: z.number().int().min(1800).max(3000).optional(),
    totalFloors: z.number().int().min(0).max(300).optional(),
    hasElevator: z.boolean().optional(),
    parkingAvailable: z.boolean().optional(),
    managementType: z.string().optional(),
    managerName: z.string().optional(),
    managerPhone: z.string().optional(),
    memo: z.string().optional(),
    documentNames: z.array(z.string()).max(5).optional(),
    documentDataList: z.array(z.string()).max(5).optional(),
  })
  .refine(
    (value) => (value.imageNames?.length ?? 0) === (value.imageDataList?.length ?? 0),
    { message: "이미지 파일명과 이미지 데이터 개수가 일치해야 합니다." },
  )
  .refine(
    (value) =>
      (value.documentNames?.length ?? 0) === (value.documentDataList?.length ?? 0),
    { message: "문서 파일명과 문서 데이터 개수가 일치해야 합니다." },
  );

function normalizeFiles(names?: string[], dataList?: string[], max = 5) {
  return {
    names: names?.slice(0, max) ?? [],
    dataList: dataList?.slice(0, max) ?? [],
  };
}

function normalizePropertyImages(data: z.infer<typeof propertySchema>) {
  const images = normalizeFiles(data.imageNames, data.imageDataList);

  if (images.names.length === 0 && data.imageName && data.imageData) {
    images.names.push(data.imageName);
    images.dataList.push(data.imageData);
  }

  return {
    imageNames: images.names,
    imageDataList: images.dataList,
    imageName: images.names[0] ?? "",
    imageData: images.dataList[0] ?? "",
  };
}

function propertyData(data: z.infer<typeof propertySchema>) {
  const images = normalizePropertyImages(data);
  const documents = normalizeFiles(data.documentNames, data.documentDataList);

  return {
    name: data.name,
    address: data.address,
    type: toDbPropertyType(data.type),
    imageName: images.imageName,
    imageData: images.imageData,
    imageNames: images.imageNames,
    imageDataList: images.imageDataList,
    builtYear: data.builtYear ?? null,
    totalFloors: data.totalFloors ?? null,
    hasElevator: data.hasElevator ?? false,
    parkingAvailable: data.parkingAvailable ?? false,
    managementType: data.managementType,
    managerName: data.managerName,
    managerPhone: data.managerPhone,
    memo: data.memo,
    documentNames: documents.names,
    documentDataList: documents.dataList,
  };
}

app.get("/api/properties", requireAuth, async (req, res) => {
  const properties = await prisma.property.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: "desc" },
  });
  res.json(properties.map(toApiProperty));
});

app.post("/api/properties", requireAuth, async (req, res) => {
  const result = propertySchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ message: "입력값을 확인하세요." });

  const property = await prisma.property.create({
    data: {
      userId: req.userId!,
      ...propertyData(result.data),
    },
  });

  res.status(201).json(toApiProperty(property));
});

app.put("/api/properties/:id", requireAuth, async (req, res) => {
  const result = propertySchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ message: "입력값을 확인하세요." });
  const id = String(req.params.id);

  const updated = await prisma.property.updateMany({
    where: { id, userId: req.userId },
    data: propertyData(result.data),
  });
  if (updated.count === 0) return res.status(404).json({ message: "건물을 찾을 수 없습니다." });

  const property = await prisma.property.findFirstOrThrow({
    where: { id, userId: req.userId },
  });
  res.json(toApiProperty(property));
});

app.delete("/api/properties/:id", requireAuth, async (req, res) => {
  const id = String(req.params.id);
  const deleted = await prisma.property.deleteMany({
    where: { id, userId: req.userId },
  });
  if (deleted.count === 0) return res.status(404).json({ message: "건물을 찾을 수 없습니다." });
  res.status(204).send();
});

const roomSchema = z.object({
  propertyId: z.string().min(1),
  name: z.string().min(1),
  floor: z.number().int(),
  type: z.enum(["원룸", "투룸", "쓰리룸", "오피스텔", "상가", "사무실"]),
  status: z.enum(["vacant", "occupied", "reserved", "maintenance"]),
  deposit: z.number().int().nonnegative(),
  monthlyRent: z.number().int().nonnegative(),
  maintenanceFee: z.number().int().nonnegative(),
  area: z.number().nonnegative(),
  memo: z.string().optional(),
});

app.get("/api/rooms", requireAuth, async (req, res) => {
  const rooms = await prisma.room.findMany({
    where: {
      userId: req.userId,
      propertyId:
        typeof req.query.propertyId === "string" ? req.query.propertyId : undefined,
    },
    orderBy: [{ propertyId: "asc" }, { floor: "asc" }, { name: "asc" }],
  });
  res.json(rooms.map(toApiRoom));
});

app.post("/api/rooms", requireAuth, async (req, res) => {
  const result = roomSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ message: "입력값을 확인하세요." });

  const property = await prisma.property.findFirst({
    where: { id: result.data.propertyId, userId: req.userId },
  });
  if (!property) return res.status(404).json({ message: "건물을 찾을 수 없습니다." });

  const room = await prisma.room.create({
    data: {
      userId: req.userId!,
      propertyId: result.data.propertyId,
      name: result.data.name,
      floor: result.data.floor,
      type: toDbRoomType(result.data.type),
      status: toDbRoomStatus(result.data.status),
      deposit: result.data.deposit,
      monthlyRent: result.data.monthlyRent,
      maintenanceFee: result.data.maintenanceFee,
      area: result.data.area,
      memo: result.data.memo,
    },
  });

  res.status(201).json(toApiRoom(room));
});

app.put("/api/rooms/:id", requireAuth, async (req, res) => {
  const result = roomSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ message: "입력값을 확인하세요." });
  const id = String(req.params.id);

  const updated = await prisma.room.updateMany({
    where: { id, userId: req.userId },
    data: {
      propertyId: result.data.propertyId,
      name: result.data.name,
      floor: result.data.floor,
      type: toDbRoomType(result.data.type),
      status: toDbRoomStatus(result.data.status),
      deposit: result.data.deposit,
      monthlyRent: result.data.monthlyRent,
      maintenanceFee: result.data.maintenanceFee,
      area: result.data.area,
      memo: result.data.memo,
    },
  });
  if (updated.count === 0) return res.status(404).json({ message: "호실을 찾을 수 없습니다." });

  const room = await prisma.room.findFirstOrThrow({
    where: { id, userId: req.userId },
  });
  res.json(toApiRoom(room));
});

app.delete("/api/rooms/:id", requireAuth, async (req, res) => {
  const id = String(req.params.id);
  const deleted = await prisma.room.deleteMany({
    where: { id, userId: req.userId },
  });
  if (deleted.count === 0) return res.status(404).json({ message: "호실을 찾을 수 없습니다." });
  res.status(204).send();
});

const tenantSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().optional(),
  memo: z.string().optional(),
});

app.get("/api/tenants", requireAuth, async (req, res) => {
  const tenants = await prisma.tenant.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: "desc" },
  });
  res.json(tenants.map(toApiTenant));
});

app.post("/api/tenants", requireAuth, async (req, res) => {
  const result = tenantSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ message: "입력값을 확인하세요." });

  const tenant = await prisma.tenant.create({
    data: {
      userId: req.userId!,
      name: result.data.name,
      phone: result.data.phone,
      email: result.data.email,
      memo: result.data.memo,
    },
  });
  res.status(201).json(toApiTenant(tenant));
});

app.put("/api/tenants/:id", requireAuth, async (req, res) => {
  const result = tenantSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ message: "입력값을 확인하세요." });
  const id = String(req.params.id);

  const updated = await prisma.tenant.updateMany({
    where: { id, userId: req.userId },
    data: {
      name: result.data.name,
      phone: result.data.phone,
      email: result.data.email,
      memo: result.data.memo,
    },
  });
  if (updated.count === 0) return res.status(404).json({ message: "임차인을 찾을 수 없습니다." });

  const tenant = await prisma.tenant.findFirstOrThrow({
    where: { id, userId: req.userId },
  });
  res.json(toApiTenant(tenant));
});

app.delete("/api/tenants/:id", requireAuth, async (req, res) => {
  const id = String(req.params.id);
  const deleted = await prisma.tenant.deleteMany({
    where: { id, userId: req.userId },
  });
  if (deleted.count === 0) return res.status(404).json({ message: "임차인을 찾을 수 없습니다." });
  res.status(204).send();
});

const contractSchema = z.object({
  propertyId: z.string().min(1),
  roomId: z.string().min(1),
  tenantId: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  deposit: z.number().int().nonnegative(),
  monthlyRent: z.number().int().nonnegative(),
  maintenanceFee: z.number().int().nonnegative(),
  paymentDay: z.number().int().min(1).max(31),
  status: z.enum(["active", "scheduled", "expired", "terminated"]),
  memo: z.string().optional(),
  attachmentName: z.string().optional(),
  attachmentData: z.string().optional(),
});

app.get("/api/contracts", requireAuth, async (req, res) => {
  const contracts = await prisma.contract.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: "desc" },
  });
  res.json(contracts.map(toApiContract));
});

app.post("/api/contracts", requireAuth, async (req, res) => {
  const result = contractSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ message: "입력값을 확인하세요." });

  const [property, room, tenant] = await Promise.all([
    prisma.property.findFirst({ where: { id: result.data.propertyId, userId: req.userId } }),
    prisma.room.findFirst({ where: { id: result.data.roomId, userId: req.userId } }),
    prisma.tenant.findFirst({ where: { id: result.data.tenantId, userId: req.userId } }),
  ]);
  if (!property || !room || !tenant) {
    return res.status(404).json({ message: "건물, 호실, 임차인 정보를 확인하세요." });
  }

  const contract = await prisma.contract.create({
    data: {
      userId: req.userId!,
      propertyId: result.data.propertyId,
      roomId: result.data.roomId,
      tenantId: result.data.tenantId,
      startDate: new Date(result.data.startDate),
      endDate: new Date(result.data.endDate),
      deposit: result.data.deposit,
      monthlyRent: result.data.monthlyRent,
      maintenanceFee: result.data.maintenanceFee,
      paymentDay: result.data.paymentDay,
      status: toDbContractStatus(result.data.status),
      memo: result.data.memo,
      attachmentName: result.data.attachmentName,
      attachmentData: result.data.attachmentData,
    },
  });
  await prisma.room.updateMany({
    where: { id: result.data.roomId, userId: req.userId },
    data: { status: result.data.status === "active" ? "OCCUPIED" : room.status },
  });
  res.status(201).json(toApiContract(contract));
});

app.put("/api/contracts/:id", requireAuth, async (req, res) => {
  const result = contractSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ message: "입력값을 확인하세요." });
  const id = String(req.params.id);

  const updated = await prisma.contract.updateMany({
    where: { id, userId: req.userId },
    data: {
      propertyId: result.data.propertyId,
      roomId: result.data.roomId,
      tenantId: result.data.tenantId,
      startDate: new Date(result.data.startDate),
      endDate: new Date(result.data.endDate),
      deposit: result.data.deposit,
      monthlyRent: result.data.monthlyRent,
      maintenanceFee: result.data.maintenanceFee,
      paymentDay: result.data.paymentDay,
      status: toDbContractStatus(result.data.status),
      memo: result.data.memo,
      attachmentName: result.data.attachmentName,
      attachmentData: result.data.attachmentData,
    },
  });
  if (updated.count === 0) return res.status(404).json({ message: "계약을 찾을 수 없습니다." });

  const contract = await prisma.contract.findFirstOrThrow({
    where: { id, userId: req.userId },
  });
  res.json(toApiContract(contract));
});

app.delete("/api/contracts/:id", requireAuth, async (req, res) => {
  const id = String(req.params.id);
  const deleted = await prisma.contract.deleteMany({
    where: { id, userId: req.userId },
  });
  if (deleted.count === 0) return res.status(404).json({ message: "계약을 찾을 수 없습니다." });
  res.status(204).send();
});

const rentPaymentSchema = z.object({
  contractId: z.string().min(1),
  dueDate: z.string().min(1),
  paidDate: z.string().optional(),
  rentAmount: z.number().int().nonnegative(),
  maintenanceFee: z.number().int().nonnegative(),
  status: z.enum(["paid", "unpaid", "late"]),
  memo: z.string().optional(),
});

app.get("/api/rent-payments", requireAuth, async (req, res) => {
  const payments = await prisma.rentPayment.findMany({
    where: { userId: req.userId },
    orderBy: { dueDate: "desc" },
  });
  res.json(payments.map(toApiRentPayment));
});

app.post("/api/rent-payments/generate-month", requireAuth, async (req, res) => {
  const result = z.object({ month: z.string().regex(/^\d{4}-\d{2}$/) }).safeParse(req.body);
  if (!result.success) return res.status(400).json({ message: "생성할 월을 선택하세요." });

  const [year, month] = result.data.month.split("-").map(Number);
  const monthStart = new Date(year, month - 1, 1);
  const nextMonthStart = new Date(year, month, 1);
  const contracts = await prisma.contract.findMany({
    where: { userId: req.userId, status: "ACTIVE" },
  });

  const created = [];
  for (const contract of contracts) {
    const exists = await prisma.rentPayment.findFirst({
      where: {
        userId: req.userId,
        contractId: contract.id,
        dueDate: { gte: monthStart, lt: nextMonthStart },
      },
    });
    if (exists) continue;

    const lastDay = new Date(year, month, 0).getDate();
    const dueDate = new Date(year, month - 1, Math.min(contract.paymentDay, lastDay));
    const payment = await prisma.rentPayment.create({
      data: {
        userId: req.userId!,
        contractId: contract.id,
        dueDate,
        rentAmount: contract.monthlyRent,
        maintenanceFee: contract.maintenanceFee,
        status: "UNPAID",
        memo: `${result.data.month} 자동 생성`,
      },
    });
    created.push(payment);
  }

  res.status(201).json({
    createdCount: created.length,
    payments: created.map(toApiRentPayment),
  });
});

app.post("/api/rent-payments", requireAuth, async (req, res) => {
  const result = rentPaymentSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ message: "입력값을 확인하세요." });

  const contract = await prisma.contract.findFirst({
    where: { id: result.data.contractId, userId: req.userId },
  });
  if (!contract) return res.status(404).json({ message: "계약을 찾을 수 없습니다." });

  const payment = await prisma.rentPayment.create({
    data: {
      userId: req.userId!,
      contractId: result.data.contractId,
      dueDate: new Date(result.data.dueDate),
      paidDate: result.data.paidDate ? new Date(result.data.paidDate) : null,
      rentAmount: result.data.rentAmount,
      maintenanceFee: result.data.maintenanceFee,
      status: toDbRentStatus(result.data.status),
      memo: result.data.memo,
    },
  });
  res.status(201).json(toApiRentPayment(payment));
});

app.put("/api/rent-payments/:id", requireAuth, async (req, res) => {
  const result = rentPaymentSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ message: "입력값을 확인하세요." });
  const id = String(req.params.id);

  const updated = await prisma.rentPayment.updateMany({
    where: { id, userId: req.userId },
    data: {
      contractId: result.data.contractId,
      dueDate: new Date(result.data.dueDate),
      paidDate: result.data.paidDate ? new Date(result.data.paidDate) : null,
      rentAmount: result.data.rentAmount,
      maintenanceFee: result.data.maintenanceFee,
      status: toDbRentStatus(result.data.status),
      memo: result.data.memo,
    },
  });
  if (updated.count === 0) return res.status(404).json({ message: "월세 내역을 찾을 수 없습니다." });

  const payment = await prisma.rentPayment.findFirstOrThrow({
    where: { id, userId: req.userId },
  });
  res.json(toApiRentPayment(payment));
});

app.delete("/api/rent-payments/:id", requireAuth, async (req, res) => {
  const id = String(req.params.id);
  const deleted = await prisma.rentPayment.deleteMany({
    where: { id, userId: req.userId },
  });
  if (deleted.count === 0) return res.status(404).json({ message: "월세 내역을 찾을 수 없습니다." });
  res.status(204).send();
});

const maintenanceSchema = z.object({
  propertyId: z.string().min(1),
  roomId: z.string().optional(),
  title: z.string().min(1),
  billingMonth: z.string().regex(/^\d{4}-\d{2}$/),
  dueDate: z.string().min(1),
  amount: z.number().int().nonnegative(),
  status: z.enum(["paid", "unpaid", "late"]),
  paidDate: z.string().optional(),
  memo: z.string().optional(),
});

app.get("/api/maintenance-charges", requireAuth, async (req, res) => {
  const charges = await prisma.maintenanceCharge.findMany({
    where: { userId: req.userId },
    orderBy: [{ dueDate: "desc" }, { createdAt: "desc" }],
  });
  res.json(charges.map(toApiMaintenanceCharge));
});

app.post("/api/maintenance-charges", requireAuth, async (req, res) => {
  const result = maintenanceSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ message: "입력값을 확인하세요." });

  const property = await prisma.property.findFirst({
    where: { id: result.data.propertyId, userId: req.userId },
  });
  if (!property) return res.status(404).json({ message: "건물을 찾을 수 없습니다." });

  if (result.data.roomId) {
    const room = await prisma.room.findFirst({
      where: { id: result.data.roomId, propertyId: result.data.propertyId, userId: req.userId },
    });
    if (!room) return res.status(404).json({ message: "호실을 찾을 수 없습니다." });
  }

  const charge = await prisma.maintenanceCharge.create({
    data: {
      userId: req.userId!,
      propertyId: result.data.propertyId,
      roomId: result.data.roomId || null,
      title: result.data.title,
      billingMonth: result.data.billingMonth,
      dueDate: new Date(result.data.dueDate),
      amount: result.data.amount,
      status: toDbMaintenanceStatus(result.data.status),
      paidDate: result.data.paidDate ? new Date(result.data.paidDate) : null,
      memo: result.data.memo,
    },
  });
  res.status(201).json(toApiMaintenanceCharge(charge));
});

app.put("/api/maintenance-charges/:id", requireAuth, async (req, res) => {
  const result = maintenanceSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ message: "입력값을 확인하세요." });
  const id = String(req.params.id);

  const updated = await prisma.maintenanceCharge.updateMany({
    where: { id, userId: req.userId },
    data: {
      propertyId: result.data.propertyId,
      roomId: result.data.roomId || null,
      title: result.data.title,
      billingMonth: result.data.billingMonth,
      dueDate: new Date(result.data.dueDate),
      amount: result.data.amount,
      status: toDbMaintenanceStatus(result.data.status),
      paidDate: result.data.paidDate ? new Date(result.data.paidDate) : null,
      memo: result.data.memo,
    },
  });
  if (updated.count === 0) return res.status(404).json({ message: "관리비 청구를 찾을 수 없습니다." });

  const charge = await prisma.maintenanceCharge.findFirstOrThrow({
    where: { id, userId: req.userId },
  });
  res.json(toApiMaintenanceCharge(charge));
});

app.delete("/api/maintenance-charges/:id", requireAuth, async (req, res) => {
  const id = String(req.params.id);
  const deleted = await prisma.maintenanceCharge.deleteMany({
    where: { id, userId: req.userId },
  });
  if (deleted.count === 0) return res.status(404).json({ message: "관리비 청구를 찾을 수 없습니다." });
  res.status(204).send();
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ message: "서버 오류가 발생했습니다." });
});

app.listen(port, () => {
  console.log(`HOUSERENT API listening on http://127.0.0.1:${port}`);
});
