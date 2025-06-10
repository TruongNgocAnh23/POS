import mongoose from "mongoose";
import Item from "../models/item.model.js";
import Inventory from "../models/inventory.model.js";

// Tạo item mới
const createItem = async (req, res, next) => {
  try {
    const { category_id, code, name, image, notes } = req.body;

    const existingItem = await Item.findOne({ code });
    if (existingItem) {
      return res
        .status(400)
        .json({ error: true, message: "Item already exists." });
    }

    if (category_id) {
      const categoryExists = await Item.findById(category_id);
      if (!categoryExists) {
        return res
          .status(404)
          .json({ error: true, message: "Category not found." });
      }
    }

    const newItem = new Item({
      category_id,
      code,
      name,
      image,
      notes,
      created_by: "test",
    });

    await newItem.save();
    res.status(201).json({
      error: false,
      message: "Item created successfully.",
      data: newItem,
    });
  } catch (error) {
    error.methodName = createItem.name;
    next(error);
  }
};

// Lấy tất cả item
const getAllItems = async (req, res, next) => {
  try {
    const items = await Item.find({ is_active: true });
    res.status(200).json({ error: false, data: items });
  } catch (error) {
    error.methodName = getAllItems.name;
    next(error);
  }
};

// Lấy item theo id
const getItemById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format." });
    }

    const item = await Item.findById(id);
    if (!item || !item.is_active) {
      return res.status(404).json({ message: "Item not found." });
    }

    res.status(200).json({ error: false, data: item });
  } catch (error) {
    error.methodName = getItemById.name;
    next(error);
  }
};

// Cập nhật item
const updateItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { category_id, code, name, image, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ error: true, message: "Invalid ID format." });
    }

    const item = await Item.findById(id);
    if (!item || !item.is_active) {
      return res.status(404).json({ error: true, message: "Item not found." });
    }

    if (category_id !== undefined) {
      item.category_id = category_id;
    }
    if (code !== undefined) {
      item.code = code;
    }
    if (name !== undefined) {
      item.name = name;
    }
    if (image !== undefined) {
      item.image = image;
    }
    if (notes !== undefined) {
      item.notes = notes;
    }
    item.updated_by = "test";

    await item.save();
    res.status(200).json({
      error: false,
      message: "Item updated successfully.",
      data: item,
    });
  } catch (error) {
    error.methodName = updateItem.name;
    next(error);
  }
};

// Xóa item (soft delete)
const deleteItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ error: true, message: "Invalid ID format." });
    }

    const item = await Item.findById(id);
    if (!item || !item.is_active) {
      return res.status(404).json({ error: true, message: "Item not found." });
    }

    if (item.inventories.length > 0) {
      return res
        .status(400)
        .json({ error: true, message: "Item still exists in inventories." });
    }

    item.is_active = false;
    await item.save();

    res
      .status(200)
      .json({ error: false, message: "Item deleted successfully." });
  } catch (error) {
    error.methodName = deleteItem.name;
    next(error);
  }
};

const updateItemToInventory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const inventories = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ error: true, message: "Invalid ID format." });
    }

    const item = await Item.findById(id);
    if (!item || !item.is_active) {
      return res.status(404).json({ error: true, message: "Item not found." });
    }

    const inventoryIds = inventories.map((p) => p.inventory_id);
    const branchIds = inventories.map((p) => p.branch_id);

    // Kiểm ra format các inventory ID
    const invalidInventoryIds = inventoryIds.filter(
      (id) => !mongoose.Types.ObjectId.isValid(id)
    );
    if (invalidInventoryIds.length > 0) {
      return res.status(400).json({
        error: true,
        message: `Invalid inventory IDs format: ${invalidInventoryIds.join(
          ", "
        )}`,
      });
    }

    const invalidBranchIds = branchIds.filter(
      (id) => !mongoose.Types.ObjectId.isValid(id)
    );
    if (invalidBranchIds.length > 0) {
      return res.status(400).json({
        error: true,
        message: `Invalid branch IDs format: ${invalidBranchIds.join(", ")}`,
      });
    }

    // Tìm tất cả inventory tồn tại và còn hoạt động
    const existingInventories = await Inventory.find({
      _id: { $in: inventoryIds },
      is_active: true,
    });
    // Lấy danh sách các ID tồn tại và is_active = true
    const existingIdsSet = new Set(
      existingInventories.map((inv) => inv._id.toString())
    );
    // Lọc ra những ID không tồn tại hoặc is_active = false
    const notFoundIds = inventoryIds.filter(
      (invId) => !existingIdsSet.has(invId.toString())
    );
    if (notFoundIds.length > 0) {
      return res.status(404).json({
        error: true,
        message: `Inventories not found: ${notFoundIds.join(", ")}`,
      });
    }

    // Nếu inventory_id đã tồn tại => cập nhật
    // Nếu chưa tồn tại => push thêm mới
    for (const inventory of inventories) {
      const existingInventory = item.inventories.find(
        (inv) =>
          inv.inventory_id.toString() === inventory.inventory_id.toString()
      );

      if (existingInventory) {
        if (inventory.branch_id !== undefined) {
          existingInventory.branch_id = inventory.branch_id;
        }
        if (inventory.quantity !== undefined) {
          existingInventory.quantity = inventory.quantity;
        }
        if (inventory.cost !== undefined) {
          existingInventory.cost = inventory.cost;
        }
        if (inventory.wholesale_price !== undefined) {
          existingInventory.wholesale_price = inventory.wholesale_price;
        }
        if (inventory.retail_price !== undefined) {
          existingInventory.retail_price = inventory.retail_price;
        }
      } else {
        item.inventories.push({
          inventory_id: inventory.inventory_id,
          branch_id: inventory.branch_id,
          quantity: inventory.quantity,
          cost: inventory.cost,
          wholesale_price: inventory.wholesale_price,
          retail_price: inventory.retail_price,
        });
      }
    }
    item.updated_by = "test";
    await item.save();

    res.status(200).json({
      error: false,
      message: "Item updated to inventories successfully.",
      data: item,
    });
  } catch (error) {
    error.methodName = updateItemToInventory.name;
    next(error);
  }
};

const deletedItemFromInventory = async (req, res, next) => {
  try {
    const { id, inventoryIds } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ error: true, message: "Invalid ID format." });
    }

    const item = await Item.findById(id);
    if (!item || !item.is_active) {
      return res.status(404).json({ error: true, message: "Item not found." });
    }

    // Kiểm ra format các inventory ID
    const invalidInventoryIds = inventoryIds.filter(
      (id) => !mongoose.Types.ObjectId.isValid(id)
    );
    if (invalidInventoryIds.length > 0) {
      return res.status(400).json({
        error: true,
        message: `Invalid ID format: ${invalidInventoryIds.join(", ")}`,
      });
    }

    // Kiểm tra nếu mỗi item.inventories có quantity > 0 thì không cho xóa
    // const blockedInventories = item.inventories.filter(
    //   (inv) =>
    //     inventoryIds.includes(inv.inventory_id.toString()) && inv.quantity > 0
    // );
    // if (blockedInventories.length > 0) {
    //   const blockedInventoryIds = blockedInventories.map((inv) =>
    //     inv.inventory_id.toString()
    //   );
    //   return res.status(400).json({
    //     error: true,
    //     message: `Inventories have quantity > 0: ${blockedInventoryIds.join(
    //       ", "
    //     )}`,
    //   });
    // }

    // Update lại item.inventories lấy các inventories không nằm trong array inventoryIds
    item.inventories = item.inventories.filter(
      (inv) => !inventoryIds.includes(inv.inventory_id.toString())
    );
    item.updated_by = "test";
    await item.save();

    res.status(200).json({
      error: false,
      message: "Item deleted from inventories successfully.",
    });
  } catch (error) {
    error.methodName = deletedItemFromInventory.name;
    next(error);
  }
};

export {
  createItem,
  getAllItems,
  getItemById,
  updateItem,
  deleteItem,
  updateItemToInventory,
  deletedItemFromInventory,
};
