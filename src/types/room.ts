export type RoomStatus = "vacant" | "occupied" | "reserved" | "maintenance";

export type RoomType =
  | "원룸"
  | "투룸"
  | "쓰리룸"
  | "오피스텔"
  | "상가"
  | "사무실";

export type Room = {
  id: string;
  propertyId: string;
  name: string;
  floor: number;
  type: RoomType;
  status: RoomStatus;
  deposit: number;
  monthlyRent: number;
  maintenanceFee: number;
  area: number;
  memo?: string;
};
