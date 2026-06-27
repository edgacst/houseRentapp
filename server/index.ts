import cors from "cors";
import "dotenv/config";
import express from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { requireAuth, signToken } from "./auth.js";
import {
  toApiProperty,
  toApiRoom,
  toDbPropertyType,
  toDbRoomStatus,
  toDbRoomType,
} from "./mappers.js";
import { prisma } from "./prisma.js";

const app = express();
const port = Number(process.env.API_PORT ?? 4000);

app.use(cors());
app.use(express.json());

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

const propertySchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  type: z.enum(["오피스텔", "빌라", "상가", "아파트", "원룸"]),
});

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
      name: result.data.name,
      address: result.data.address,
      type: toDbPropertyType(result.data.type),
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
    data: {
      name: result.data.name,
      address: result.data.address,
      type: toDbPropertyType(result.data.type),
    },
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

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ message: "서버 오류가 발생했습니다." });
});

app.listen(port, () => {
  console.log(`HOUSERENT API listening on http://127.0.0.1:${port}`);
});
