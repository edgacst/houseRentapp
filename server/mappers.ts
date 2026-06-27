import type { Property, Room } from "@prisma/client";

const propertyTypeToDb = {
  "오피스텔": "OFFICETEL",
  "빌라": "VILLA",
  "상가": "STORE",
  "아파트": "APARTMENT",
  "원룸": "STUDIO",
} as const;

const propertyTypeFromDb = {
  OFFICETEL: "오피스텔",
  VILLA: "빌라",
  STORE: "상가",
  APARTMENT: "아파트",
  STUDIO: "원룸",
} as const;

const roomTypeToDb = {
  "원룸": "STUDIO",
  "투룸": "TWO_ROOM",
  "쓰리룸": "THREE_ROOM",
  "오피스텔": "OFFICETEL",
  "상가": "STORE",
  "사무실": "OFFICE",
} as const;

const roomTypeFromDb = {
  STUDIO: "원룸",
  TWO_ROOM: "투룸",
  THREE_ROOM: "쓰리룸",
  OFFICETEL: "오피스텔",
  STORE: "상가",
  OFFICE: "사무실",
} as const;

const roomStatusToDb = {
  vacant: "VACANT",
  occupied: "OCCUPIED",
  reserved: "RESERVED",
  maintenance: "MAINTENANCE",
} as const;

const roomStatusFromDb = {
  VACANT: "vacant",
  OCCUPIED: "occupied",
  RESERVED: "reserved",
  MAINTENANCE: "maintenance",
} as const;

export function toDbPropertyType(type: string) {
  return propertyTypeToDb[type as keyof typeof propertyTypeToDb];
}

export function toApiProperty(property: Property) {
  return {
    id: property.id,
    name: property.name,
    address: property.address,
    type: propertyTypeFromDb[property.type],
  };
}

export function toDbRoomType(type: string) {
  return roomTypeToDb[type as keyof typeof roomTypeToDb];
}

export function toDbRoomStatus(status: string) {
  return roomStatusToDb[status as keyof typeof roomStatusToDb];
}

export function toApiRoom(room: Room) {
  return {
    id: room.id,
    propertyId: room.propertyId,
    name: room.name,
    floor: room.floor,
    type: roomTypeFromDb[room.type],
    status: roomStatusFromDb[room.status],
    deposit: room.deposit,
    monthlyRent: room.monthlyRent,
    maintenanceFee: room.maintenanceFee,
    area: room.area,
    memo: room.memo ?? "",
  };
}
