import { useMemo, useState } from "react";
import PropertyList from "../components/property/PropertyList";
import { useAppData } from "../context/AppContext";
import MainLayout from "../layouts/MainLayout";
import type { Property, PropertyType } from "../types/property";
import type { Room } from "../types/room";

const propertyTypes: PropertyType[] = ["오피스텔", "빌라", "상가", "아파트", "원룸"];

const emptyPropertyForm: Omit<Property, "id"> = {
  name: "",
  address: "",
  type: "오피스텔",
  imageName: "",
  imageData: "",
  imageNames: [],
  imageDataList: [],
  builtYear: undefined,
  totalFloors: undefined,
  hasElevator: false,
  parkingAvailable: false,
  managementType: "직접관리",
  managerName: "",
  managerPhone: "",
  memo: "",
  purchasePrice: 0,
  acquisitionTax: 0,
  brokerageFee: 0,
  renovationCost: 0,
  otherPurchaseCost: 0,
  loanAmount: 0,
  documentNames: [],
  documentDataList: [],
};

function Properties() {
  const {
    properties,
    rooms,
    addProperty,
    updateProperty,
    deleteProperty,
    upsertRoom,
  } = useAppData();
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [form, setForm] = useState<Omit<Property, "id">>(emptyPropertyForm);
  const [initialRooms, setInitialRooms] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const imageNames = form.imageNames ?? [];
  const imageDataList = form.imageDataList ?? [];
  const documentNames = form.documentNames ?? [];
  const documentDataList = form.documentDataList ?? [];
  const totalAcquisitionCost = getTotalAcquisitionCost(form);
  const equityAmount = Math.max(0, totalAcquisitionCost - (form.loanAmount ?? 0));

  const filteredProperties = useMemo(() => {
    const keyword = search.toLowerCase();
    return properties.filter(
      (property) =>
        property.name.toLowerCase().includes(keyword) ||
        property.address.toLowerCase().includes(keyword) ||
        property.type.toLowerCase().includes(keyword) ||
        property.managerName?.toLowerCase().includes(keyword),
    );
  }, [properties, search]);

  const totalRooms = rooms.length;
  const vacantRooms = rooms.filter((room) => room.status === "vacant").length;

  const openCreateForm = () => {
    setEditingProperty(null);
    setForm(emptyPropertyForm);
    setInitialRooms("");
    setIsOpen(true);
  };

  const openEditForm = (property: Property) => {
    const nextImageNames =
      property.imageNames && property.imageNames.length > 0
        ? property.imageNames
        : property.imageName
          ? [property.imageName]
          : [];
    const nextImageDataList =
      property.imageDataList && property.imageDataList.length > 0
        ? property.imageDataList
        : property.imageData
          ? [property.imageData]
          : [];

    setEditingProperty(property);
    setForm({
      ...emptyPropertyForm,
      ...property,
      imageName: nextImageNames[0] ?? "",
      imageData: nextImageDataList[0] ?? "",
      imageNames: nextImageNames,
      imageDataList: nextImageDataList,
      documentNames: property.documentNames ?? [],
      documentDataList: property.documentDataList ?? [],
    });
    setInitialRooms("");
    setIsOpen(true);
  };

  const closeForm = () => {
    setEditingProperty(null);
    setForm(emptyPropertyForm);
    setInitialRooms("");
    setIsOpen(false);
  };

  const handleImageChange = async (files?: FileList | null) => {
    if (!files?.length) return;
    const roomLeft = Math.max(0, 5 - imageNames.length);
    const nextFiles = await filesToDataItems(Array.from(files).slice(0, roomLeft));
    const nextImageNames = [...imageNames, ...nextFiles.map((file) => file.name)];
    const nextImageDataList = [
      ...imageDataList,
      ...nextFiles.map((file) => file.data),
    ];

    setForm({
      ...form,
      imageName: nextImageNames[0] ?? "",
      imageData: nextImageDataList[0] ?? "",
      imageNames: nextImageNames,
      imageDataList: nextImageDataList,
    });
  };

  const handleDocumentChange = async (files?: FileList | null) => {
    if (!files?.length) return;
    const roomLeft = Math.max(0, 5 - documentNames.length);
    const nextFiles = await filesToDataItems(Array.from(files).slice(0, roomLeft));
    setForm({
      ...form,
      documentNames: [...documentNames, ...nextFiles.map((file) => file.name)],
      documentDataList: [...documentDataList, ...nextFiles.map((file) => file.data)],
    });
  };

  const removeImage = (index: number) => {
    const nextImageNames = imageNames.filter((_, itemIndex) => itemIndex !== index);
    const nextImageDataList = imageDataList.filter(
      (_, itemIndex) => itemIndex !== index,
    );
    setForm({
      ...form,
      imageName: nextImageNames[0] ?? "",
      imageData: nextImageDataList[0] ?? "",
      imageNames: nextImageNames,
      imageDataList: nextImageDataList,
    });
  };

  const removeDocument = (index: number) => {
    setForm({
      ...form,
      documentNames: documentNames.filter((_, itemIndex) => itemIndex !== index),
      documentDataList: documentDataList.filter(
        (_, itemIndex) => itemIndex !== index,
      ),
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      if (editingProperty) {
        await updateProperty({ ...editingProperty, ...form });
        const roomNames = parseRoomNames(initialRooms);
        await Promise.all(
          roomNames.map((roomName) =>
            upsertRoom(createInitialRoom(editingProperty.id, roomName, form.type)),
          ),
        );
      } else {
        const createdProperty = await addProperty(form);
        const roomNames = parseRoomNames(initialRooms);
        await Promise.all(
          roomNames.map((roomName) =>
            upsertRoom(createInitialRoom(createdProperty.id, roomName, form.type)),
          ),
        );
      }

      closeForm();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (propertyId: string) => {
    if (
      !window.confirm(
        "건물을 삭제하면 연결된 호실, 계약, 월세, 관리비 데이터도 함께 삭제됩니다. 계속할까요?",
      )
    ) {
      return;
    }
    void deleteProperty(propertyId);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-bold text-blue-600">Property</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">
              부동산 관리
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              건물 정보, 매입 비용, 사진, 문서, 초기 호실을 등록하고 운영 기준을 관리합니다.
            </p>
          </div>
          <button
            onClick={openCreateForm}
            className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
          >
            + 건물 등록
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard title="총 건물" value={`${properties.length}개`} />
          <SummaryCard title="총 호실" value={`${totalRooms}개`} />
          <SummaryCard title="공실" value={`${vacantRooms}개`} />
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="건물명, 주소, 유형, 관리인으로 검색"
            className="w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
          />
        </div>

        {isOpen && (
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">
              {editingProperty ? "건물 수정" : "건물 등록"}
            </h2>
            <form onSubmit={handleSubmit} className="mt-5 grid gap-5">
              <Section title="기본 정보">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormInput
                    label="건물명"
                    value={form.name}
                    placeholder="예: 강남 오피스텔"
                    onChange={(value) => setForm({ ...form, name: value })}
                  />
                  <FormInput
                    label="주소"
                    value={form.address}
                    placeholder="예: 서울 강남구 테헤란로 100"
                    onChange={(value) => setForm({ ...form, address: value })}
                  />
                  <div>
                    <label className="text-sm font-bold text-slate-700">유형</label>
                    <select
                      value={form.type}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          type: event.target.value as PropertyType,
                        })
                      }
                      className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
                    >
                      {propertyTypes.map((type) => (
                        <option key={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <NumberInput
                    label="준공년도"
                    value={form.builtYear}
                    placeholder="예: 2018"
                    onChange={(value) => setForm({ ...form, builtYear: value })}
                  />
                  <NumberInput
                    label="총 층수"
                    value={form.totalFloors}
                    placeholder="예: 12"
                    onChange={(value) => setForm({ ...form, totalFloors: value })}
                  />
                  <FormInput
                    label="관리 방식"
                    value={form.managementType ?? ""}
                    placeholder="예: 직접관리, 위탁관리"
                    onChange={(value) => setForm({ ...form, managementType: value })}
                  />
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <Toggle
                    label="엘리베이터 있음"
                    checked={Boolean(form.hasElevator)}
                    onChange={(checked) => setForm({ ...form, hasElevator: checked })}
                  />
                  <Toggle
                    label="주차 가능"
                    checked={Boolean(form.parkingAvailable)}
                    onChange={(checked) =>
                      setForm({ ...form, parkingAvailable: checked })
                    }
                  />
                </div>
              </Section>

              <Section title="매입/투자 비용">
                <p className="mb-4 text-xs text-slate-500">
                  다른 임대관리 프로그램도 보통 매입가, 취득세, 중개수수료, 수리비,
                  기타비용, 대출금을 나눠 기록하고 총투입비와 자기자본을 계산합니다.
                </p>
                <div className="grid gap-4 md:grid-cols-3">
                  <MoneyInput
                    label="매입가"
                    value={form.purchasePrice ?? 0}
                    onChange={(value) => setForm({ ...form, purchasePrice: value })}
                  />
                  <MoneyInput
                    label="취득세/등기비"
                    value={form.acquisitionTax ?? 0}
                    onChange={(value) => setForm({ ...form, acquisitionTax: value })}
                  />
                  <MoneyInput
                    label="중개수수료"
                    value={form.brokerageFee ?? 0}
                    onChange={(value) => setForm({ ...form, brokerageFee: value })}
                  />
                  <MoneyInput
                    label="수리/리모델링비"
                    value={form.renovationCost ?? 0}
                    onChange={(value) => setForm({ ...form, renovationCost: value })}
                  />
                  <MoneyInput
                    label="기타 구입비용"
                    value={form.otherPurchaseCost ?? 0}
                    onChange={(value) => setForm({ ...form, otherPurchaseCost: value })}
                  />
                  <MoneyInput
                    label="대출금"
                    value={form.loanAmount ?? 0}
                    onChange={(value) => setForm({ ...form, loanAmount: value })}
                  />
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <InvestmentBox label="총투입비" value={totalAcquisitionCost} />
                  <InvestmentBox label="대출금" value={form.loanAmount ?? 0} />
                  <InvestmentBox label="자기자본" value={equityAmount} />
                </div>
              </Section>

              <Section title="관리 담당자">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormInput
                    label="관리인/담당자"
                    value={form.managerName ?? ""}
                    placeholder="예: 홍길동"
                    required={false}
                    onChange={(value) => setForm({ ...form, managerName: value })}
                  />
                  <FormInput
                    label="담당자 전화번호"
                    value={form.managerPhone ?? ""}
                    placeholder="예: 010-1234-5678"
                    required={false}
                    onChange={(value) => setForm({ ...form, managerPhone: value })}
                  />
                </div>
                <label className="mt-4 block">
                  <span className="text-sm font-bold text-slate-700">건물 메모</span>
                  <textarea
                    value={form.memo ?? ""}
                    onChange={(event) => setForm({ ...form, memo: event.target.value })}
                    rows={3}
                    placeholder="공과금 정산 방식, 특이사항, 관리 기준을 입력하세요."
                    className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  />
                </label>
              </Section>

              <FileSection
                title="건물 사진"
                description="최대 5장까지 저장됩니다. 첫 번째 사진이 카드 대표 이미지로 표시됩니다."
                count={`${imageNames.length}/5장`}
                accept="image/png,image/jpeg,image/webp"
                disabled={imageNames.length >= 5}
                onChange={handleImageChange}
              >
                {imageNames.length > 0 && (
                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                    {imageNames.map((name, index) => (
                      <FilePreviewCard
                        key={`${name}-${index}`}
                        name={name}
                        data={imageDataList[index]}
                        isImage
                        onRemove={() => removeImage(index)}
                      />
                    ))}
                  </div>
                )}
              </FileSection>

              <FileSection
                title="건물 문서"
                description="등기부등본, 건축물대장, 사업자등록증 등 문서를 최대 5개까지 보관합니다."
                count={`${documentNames.length}/5개`}
                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                disabled={documentNames.length >= 5}
                onChange={handleDocumentChange}
              >
                {documentNames.length > 0 && (
                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                    {documentNames.map((name, index) => (
                      <FilePreviewCard
                        key={`${name}-${index}`}
                        name={name}
                        data={documentDataList[index]}
                        onRemove={() => removeDocument(index)}
                      />
                    ))}
                  </div>
                )}
              </FileSection>

              <Section title={editingProperty ? "추가 호실" : "초기 호실 일괄 등록"}>
                <p className="text-xs text-slate-500">
                  호실명을 쉼표나 줄바꿈으로 입력하세요. 예: 101호, 102호, 201호
                </p>
                <textarea
                  value={initialRooms}
                  onChange={(event) => setInitialRooms(event.target.value)}
                  rows={4}
                  placeholder={"101호, 102호, 201호\n또는\nB101, 1층 상가"}
                  className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </Section>

              <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
                <p className="font-bold">호실 관리는 무엇인가요?</p>
                <p className="mt-1">
                  건물 등록 시 호실 이름만 빠르게 만들고, 호실관리에서 보증금,
                  월세, 관리비, 면적, 공실 상태를 자세히 수정합니다.
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-lg border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {isSaving ? "저장 중" : "저장"}
                </button>
              </div>
            </form>
          </div>
        )}

        <PropertyList
          properties={filteredProperties}
          rooms={rooms}
          onEdit={openEditForm}
          onDelete={handleDelete}
        />
      </div>
    </MainLayout>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-200 p-4">
      <h3 className="text-sm font-black text-slate-950">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function FileSection({
  title,
  description,
  count,
  accept,
  disabled,
  children,
  onChange,
}: {
  title: string;
  description: string;
  count: string;
  accept: string;
  disabled: boolean;
  children: React.ReactNode;
  onChange: (files?: FileList | null) => void;
}) {
  return (
    <section className="rounded-lg border border-slate-200 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-slate-950">{title}</h3>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
          {count}
        </span>
      </div>
      <input
        type="file"
        multiple
        accept={accept}
        disabled={disabled}
        onChange={(event) => void onChange(event.target.files)}
        className="mt-3 block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-bold file:text-white disabled:cursor-not-allowed disabled:opacity-60"
      />
      {children}
    </section>
  );
}

function FilePreviewCard({
  name,
  data,
  isImage,
  onRemove,
}: {
  name: string;
  data: string;
  isImage?: boolean;
  onRemove: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      {isImage ? (
        <img src={data} alt={`${name} 미리보기`} className="h-24 w-full object-cover" />
      ) : (
        <div className="grid h-24 place-items-center bg-slate-50 text-xs font-black text-slate-400">
          문서
        </div>
      )}
      <div className="p-3">
        <p className="truncate text-xs font-bold text-slate-700">{name}</p>
        {data && !isImage && (
          <a
            href={data}
            download={name}
            className="mt-2 inline-flex text-xs font-bold text-blue-600"
          >
            내려받기
          </a>
        )}
        <button
          type="button"
          onClick={onRemove}
          className="ml-3 mt-2 text-xs font-bold text-red-600"
        >
          삭제
        </button>
      </div>
    </div>
  );
}

function FormInput({
  label,
  value,
  placeholder,
  required = true,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  required?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-sm font-bold text-slate-700">{label}</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        placeholder={placeholder}
        className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
      />
    </div>
  );
}

function NumberInput({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value?: number;
  placeholder: string;
  onChange: (value: number | undefined) => void;
}) {
  return (
    <div>
      <label className="text-sm font-bold text-slate-700">{label}</label>
      <input
        type="number"
        value={value ?? ""}
        onChange={(event) =>
          onChange(event.target.value ? Number(event.target.value) : undefined)
        }
        placeholder={placeholder}
        className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
      />
    </div>
  );
}

function MoneyInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <label className="text-sm font-bold text-slate-700">{label}</label>
      <div className="relative mt-2">
        <input
          type="number"
          value={value}
          min={0}
          onChange={(event) => onChange(Number(event.target.value))}
          className="w-full rounded-lg border border-slate-200 px-4 py-3 pr-12 outline-none focus:border-blue-500"
        />
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
          원
        </span>
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5"
      />
    </label>
  );
}

function InvestmentBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-black text-slate-950">
        {value.toLocaleString("ko-KR")}원
      </p>
    </div>
  );
}

function SummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-bold text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">
        {value}
      </p>
    </div>
  );
}

function parseRoomNames(value: string) {
  return Array.from(
    new Set(
      value
        .split(/[,\n]/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

function createInitialRoom(
  propertyId: string,
  name: string,
  propertyType: PropertyType,
): Room {
  return {
    id: "",
    propertyId,
    name,
    floor: inferFloor(name),
    type:
      propertyType === "상가"
        ? "상가"
        : propertyType === "오피스텔"
          ? "오피스텔"
          : "원룸",
    status: "vacant",
    deposit: 0,
    monthlyRent: 0,
    maintenanceFee: 0,
    area: 0,
    memo: "건물 등록에서 생성",
  };
}

function inferFloor(roomName: string) {
  const match = roomName.match(/\d+/);
  if (!match) return 1;

  const numeric = match[0];
  if (numeric.length >= 3) return Number(numeric.slice(0, -2)) || 1;
  return Number(numeric[0]) || 1;
}

function getTotalAcquisitionCost(property: Partial<Property>) {
  return (
    (property.purchasePrice ?? 0) +
    (property.acquisitionTax ?? 0) +
    (property.brokerageFee ?? 0) +
    (property.renovationCost ?? 0) +
    (property.otherPurchaseCost ?? 0)
  );
}

async function filesToDataItems(files: File[]) {
  return Promise.all(
    files.map(async (file) => ({
      name: file.name,
      data: await readFileAsDataUrl(file),
    })),
  );
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default Properties;
