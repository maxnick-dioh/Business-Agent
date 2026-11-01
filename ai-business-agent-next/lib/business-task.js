export function generateQuotation({
  businessName,
  customerName,
  items,
  discountPercent = 0,
}) {
  if (
    !Array.isArray(items) ||
    items.length === 0 ||
    items.length > 50
  ) {
    throw new Error("Invalid quotation items.");
  }

  if (
    !Number.isFinite(discountPercent) ||
    discountPercent < 0 ||
    discountPercent > 100
  ) {
    throw new Error("Invalid discount percentage.");
  }

  const validatedItems = items.map((item) => {
    const { productName, quantity, unitPrice } = item;

    if (
      typeof productName !== "string" ||
      !productName.trim() ||
      productName.length > 100 ||
      !Number.isInteger(quantity) ||
      quantity <= 0 ||
      quantity > 1000000 ||
      !Number.isFinite(unitPrice) ||
      unitPrice < 0 ||
      unitPrice > 1000000000
    ) {
      throw new Error("Invalid product information.");
    }

    return {
      product_name: productName.trim(),
      quantity,
      unit_price: unitPrice,
      line_total: Math.round(quantity * unitPrice * 100) / 100,
    };
  });

  const subtotal = validatedItems.reduce(
    (sum, item) => sum + item.line_total,
    0
  );

  const discount = subtotal * (discountPercent / 100);
  const total = subtotal - discount;

  return {
    quotation_status: "draft",
    business_name: businessName || "Business name not configured",
    customer_name: customerName || "Customer not provided",
    currency: "XAF",
    items: validatedItems,
    subtotal: Math.round(subtotal * 100) / 100,
    discount_percent: discountPercent,
    discount: Math.round(discount * 100) / 100,
    total: Math.round(total * 100) / 100,
    message: "This is a draft quotation, not a confirmed order.",
  };
}