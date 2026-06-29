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
  imageNames?: string[];
  imageDataList?: string[];
  builtYear?: number;
  totalFloors?: number;
  hasElevator?: boolean;
  parkingAvailable?: boolean;
  managementType?: string;
  managerName?: string;
  managerPhone?: string;
  memo?: string;
  purchasePrice?: number;
  acquisitionTax?: number;
  brokerageFee?: number;
  renovationCost?: number;
  otherPurchaseCost?: number;
  loanAmount?: number;
  documentNames?: string[];
  documentDataList?: string[];
};
