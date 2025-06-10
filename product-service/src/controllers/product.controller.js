import Product from "../models/product.model.js";

const createProduct = async (req, res, next) => {
  try {
    const { code, name, notes } = req.body;

    const existingProduct = await Product.findOne({ code });

    if (existingProduct) {
      return res
        .status(400)
        .json({ error: true, message: "Category already exists." });
    }

    const newProduct = new Product({
      code,
      name,
      notes,
      created_by: req.userData.user_name,
    });

    await newCategory.save();
    res.status(201).json({
      error: false,
      message: "Category created successfully.",
      data: newProduct,
    });
  } catch (error) {
    error.methodName = createProduct.name;
    next(error);
  }
};

const getAllProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ is_active: true });

    res.status(200).json({ error: false, data: products });
  } catch (error) {
    error.methodName = getAllProducts.name;
    next(error);
  }
};
