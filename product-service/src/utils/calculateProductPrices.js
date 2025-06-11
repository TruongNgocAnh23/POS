import ItemCategory from "../models/item-category.model.js";
import Item from "../models/item.model.js";
import Tax from "../models/tax.model.js";

const calculateProductPrices = async (product, branchId = null) => {
  let wholesaleTotal = 0;
  let retailTotal = 0;
  let wholesaleWithTax = 0;
  let retailWithTax = 0;

  for (const receiptItem of product.receipt) {
    const item = await Item.findById(receiptItem.item_id).lean();
    if (!item || item.inventories.length === 0) continue;

    // Chọn inventory theo branch nếu có
    let inventory =
      item.inventories.find((inv) =>
        branchId ? inv.branch_id.toString() === branchId : true
      ) || item.inventories[0];

    const { wholesale_price, retail_price } = inventory;
    const qty = receiptItem.quantity;

    // Lấy tax
    let taxPercent = 0;
    if (item.category_id) {
      const category = await ItemCategory.findById(item.category_id).lean();
      if (category?.tax_id) {
        const tax = await Tax.findById(category.tax_id).lean();
        taxPercent = tax?.rate || 0;
      }
    }

    const wholesale = wholesale_price * qty;
    const retail = retail_price * qty;

    wholesaleTotal += wholesale;
    retailTotal += retail;

    wholesaleWithTax += wholesale * (1 + taxPercent / 100);
    retailWithTax += retail * (1 + taxPercent / 100);
  }

  return {
    wholesaleTotal,
    retailTotal,
    wholesaleWithTax,
    retailWithTax,
  };
};

export { calculateProductPrices };
