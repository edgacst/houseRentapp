export type PropertyType = "오피스텔" | "빌라" | "상가" | "아파트" | "원룸";

export type UnitStatus = "occupied" | "vacant" | "maintenance" | "reserved";

export type Unit = {
  id: string;
  roomNumber: string;
  floor: number;
  status: UnitStatus;
  tenantName?: string;
  deposit?: number;
  monthlyRent?: number;
};

export type Property = {
  id: string;
  name: string;
  address: string;
  type: PropertyType;
  imageName?: string;
  imageData?: string;
};
