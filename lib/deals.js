export function createEmptyForm() {
  return {
    clientName: "",
    clientMobile: "",
    metal: "Gold",
    dealType: "Sell",
    weight: "",
    unit: "grams",
    purity: "",
    rate: "",
    vendorName: "",
    vendorDealType: "Buy",
    vendorRate: "",
    vendorWeight: "",
    vendorUnit: "grams",
    dealDate: new Date().toISOString().split("T")[0],
    customerDeliveryStatus: "Pending",
    vendorDeliveryStatus: "Pending",
    notes: "",
  };
}

export function buildCustomerMessage(deal) {
  return `${(deal.dealType || "").toUpperCase()} ${formatMessageNumber(
    deal.weight
  )} ${deal.purity || "-"} ${formatMessageRate(deal.rate)}`.trim();
}

export function buildVendorMessage(deal) {
  if (!deal.vendorName || deal.vendorRate === "" || deal.vendorRate === null || deal.vendorRate === undefined) {
    return "";
  }

  return `${(deal.vendorDealType || "").toUpperCase()} ${formatMessageNumber(
    deal.vendorWeight || deal.weight
  )} ${deal.purity || "-"} ${formatMessageRate(deal.vendorRate)}`.trim();
}

export function formatCurrency(value) {
  const amount = Number(value) || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatMessageNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return "0";
  }

  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) {
    return String(value);
  }

  if (Number.isInteger(numberValue)) {
    return String(numberValue);
  }

  return numberValue.toString();
}

export function formatMessageRate(value) {
  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) {
    return String(value || "0.0");
  }

  return numberValue.toFixed(1);
}

export function isVendorMatched(deal) {
  return Boolean(deal.vendorName && deal.vendorRate !== null && deal.vendorRate !== "");
}

export function isFullyDelivered(deal) {
  return (
    deal.customerDeliveryStatus === "Delivered" &&
    deal.vendorDeliveryStatus === "Delivered"
  );
}

export function getDeliveryBadgeLabel(deal) {
  if (deal.customerDeliveryStatus === "Pending" && deal.vendorDeliveryStatus === "Pending") {
    return "Both deliveries pending";
  }

  if (deal.customerDeliveryStatus === "Delivered" && deal.vendorDeliveryStatus === "Pending") {
    return "Vendor delivery pending";
  }

  if (deal.customerDeliveryStatus === "Pending" && deal.vendorDeliveryStatus === "Delivered") {
    return "Customer delivery pending";
  }

  return "Completed";
}

export function matchesFilter(deal, activeFilter) {
  if (activeFilter === "vendor-pending") {
    return !isVendorMatched(deal);
  }

  if (activeFilter === "vendor-matched") {
    return isVendorMatched(deal);
  }

  if (activeFilter === "customer-delivery-pending") {
    return deal.customerDeliveryStatus !== "Delivered";
  }

  if (activeFilter === "vendor-delivery-pending") {
    return deal.vendorDeliveryStatus !== "Delivered";
  }

  return true;
}

export function getFilterTitle(activeFilter) {
  if (activeFilter === "vendor-pending") {
    return "Vendor pending deals";
  }

  if (activeFilter === "vendor-matched") {
    return "Vendor matched deals";
  }

  if (activeFilter === "customer-delivery-pending") {
    return "Customer delivery pending deals";
  }

  if (activeFilter === "vendor-delivery-pending") {
    return "Vendor delivery pending deals";
  }

  return "Pending delivery tracker";
}

export function sanitizeDealInput(payload) {
  const deal = {
    clientName: requiredString(payload.clientName, "Customer name is required."),
    clientMobile: optionalString(payload.clientMobile),
    metal: requiredEnum(payload.metal, ["Gold", "Silver"], "Metal must be Gold or Silver."),
    dealType: requiredEnum(payload.dealType, ["Buy", "Sell"], "Customer deal type must be Buy or Sell."),
    weight: requiredNumber(payload.weight, "Customer weight is required."),
    unit: requiredEnum(payload.unit, ["grams", "kg", "tola"], "Unit is invalid."),
    purity: requiredString(payload.purity, "Purity is required."),
    rate: requiredNumber(payload.rate, "Customer rate is required."),
    vendorName: optionalString(payload.vendorName),
    vendorDealType: optionalEnum(payload.vendorDealType, ["Buy", "Sell"], "Vendor deal type is invalid.", "Buy"),
    vendorRate: optionalNumber(payload.vendorRate),
    vendorWeight: optionalNumber(payload.vendorWeight),
    vendorUnit: optionalEnum(payload.vendorUnit, ["grams", "kg", "tola"], "Vendor unit is invalid.", "grams"),
    dealDate: requiredString(payload.dealDate, "Deal date is required."),
    customerDeliveryStatus: optionalEnum(
      payload.customerDeliveryStatus,
      ["Pending", "Delivered"],
      "Customer delivery status is invalid.",
      "Pending"
    ),
    vendorDeliveryStatus: optionalEnum(
      payload.vendorDeliveryStatus,
      ["Pending", "Delivered"],
      "Vendor delivery status is invalid.",
      "Pending"
    ),
    notes: optionalString(payload.notes),
  };

  return deal;
}

export function sanitizeDealPatch(payload) {
  const updates = {};

  if (payload.customerDeliveryStatus !== undefined) {
    updates.customerDeliveryStatus = requiredEnum(
      payload.customerDeliveryStatus,
      ["Pending", "Delivered"],
      "Customer delivery status is invalid."
    );
  }

  if (payload.vendorDeliveryStatus !== undefined) {
    updates.vendorDeliveryStatus = requiredEnum(
      payload.vendorDeliveryStatus,
      ["Pending", "Delivered"],
      "Vendor delivery status is invalid."
    );
  }

  return updates;
}

export function sortDealsNewestFirst(deals) {
  return [...deals].sort((left, right) => {
    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });
}

export function toDatabaseDeal(deal) {
  return {
    user_id: deal.userId,
    client_name: deal.clientName,
    client_mobile: deal.clientMobile,
    metal: deal.metal,
    deal_type: deal.dealType,
    weight: deal.weight,
    unit: deal.unit,
    purity: deal.purity,
    rate: deal.rate,
    vendor_name: deal.vendorName,
    vendor_deal_type: deal.vendorDealType,
    vendor_rate: deal.vendorRate,
    vendor_weight: deal.vendorWeight,
    vendor_unit: deal.vendorUnit,
    deal_date: deal.dealDate,
    customer_delivery_status: deal.customerDeliveryStatus,
    vendor_delivery_status: deal.vendorDeliveryStatus,
    notes: deal.notes,
  };
}

export function fromDatabaseDeal(row) {
  return {
    id: row.id,
    userId: row.user_id,
    clientName: row.client_name,
    clientMobile: row.client_mobile,
    metal: row.metal,
    dealType: row.deal_type,
    weight: row.weight,
    unit: row.unit,
    purity: row.purity,
    rate: row.rate,
    vendorName: row.vendor_name,
    vendorDealType: row.vendor_deal_type,
    vendorRate: row.vendor_rate,
    vendorWeight: row.vendor_weight,
    vendorUnit: row.vendor_unit,
    dealDate: row.deal_date,
    customerDeliveryStatus: row.customer_delivery_status,
    vendorDeliveryStatus: row.vendor_delivery_status,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toDatabasePatch(updates) {
  const databasePatch = {};

  if (updates.customerDeliveryStatus !== undefined) {
    databasePatch.customer_delivery_status = updates.customerDeliveryStatus;
  }

  if (updates.vendorDeliveryStatus !== undefined) {
    databasePatch.vendor_delivery_status = updates.vendorDeliveryStatus;
  }

  return databasePatch;
}

function requiredString(value, message) {
  const normalized = String(value ?? "").trim();
  if (!normalized) {
    throw new Error(message);
  }
  return normalized;
}

function optionalString(value) {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

function requiredNumber(value, message) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue <= 0) {
    throw new Error(message);
  }
  return numberValue;
}

function optionalNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue <= 0) {
    throw new Error("Numeric field must be greater than 0.");
  }

  return numberValue;
}

function requiredEnum(value, allowedValues, message) {
  if (!allowedValues.includes(value)) {
    throw new Error(message);
  }
  return value;
}

function optionalEnum(value, allowedValues, message, fallbackValue) {
  if (value === null || value === undefined || value === "") {
    return fallbackValue;
  }

  if (!allowedValues.includes(value)) {
    throw new Error(message);
  }

  return value;
}
