import Product from '../models/Product.js';
import Ingredient from '../models/Ingredient.js';

export const deductInventoryStock = async (order) => {
  try {
    console.log(`\n📦 [INVENTORY ENGINE] deductInventoryStock called for Order #${order.orderNumber}`);
    if (!order || !order.items || order.items.length === 0) {
      console.log(`⚠️ [INVENTORY ENGINE] Order items list is empty.`);
      return;
    }

    for (const item of order.items) {
      console.log(`🔍 [INVENTORY ENGINE] Item: "${item.name}", qty: ${item.qty}, productId: ${item.productId}`);
      if (!item.productId) {
        console.log(`⚠️ [INVENTORY ENGINE] Item has no productId, skipping.`);
        continue;
      }
      
      const product = await Product.findById(item.productId);
      if (!product) {
        console.log(`❌ [INVENTORY ENGINE] Product with ID ${item.productId} not found in database!`);
        continue;
      }

      console.log(`📄 [INVENTORY ENGINE] Found Product: "${product.name}", trackStock: ${product.trackStock}, current stock: ${product.stock}`);

      // 1. Direct Product Stock Tracking
      if (product.trackStock) {
        const updated = await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { stock: -item.qty } },
          { new: true }
        );
        console.log(`✅ [INVENTORY ENGINE] Direct stock deducted by ${item.qty}. New stock: ${updated.stock}`);
      } else {
        console.log(`ℹ️ [INVENTORY ENGINE] Direct stock tracking is NOT enabled for "${product.name}".`);
      }

      // 2. Recipe-based Ingredient Stock Tracking
      if (product.recipe && product.recipe.length > 0) {
        console.log(`🍜 [INVENTORY ENGINE] Recipe links found for "${product.name}". Processing ${product.recipe.length} ingredients.`);
        for (const recipeItem of product.recipe) {
          if (!recipeItem.ingredientId) continue;
          
          const qtyToDeduct = recipeItem.quantity * item.qty;
          
          const updatedIng = await Ingredient.findByIdAndUpdate(
            recipeItem.ingredientId,
            { $inc: { stock: -qtyToDeduct } },
            { new: true }
          );
          console.log(`✅ [INVENTORY ENGINE] Ingredient ${recipeItem.ingredientId} stock reduced by ${qtyToDeduct}. New stock: ${updatedIng?.stock}`);
        }
      }
    }
    console.log(`📦 [INVENTORY ENGINE] Finished processing order #${order.orderNumber}\n`);
  } catch (error) {
    console.error("❌ [INVENTORY ENGINE] Error deducting inventory stock:", error);
  }
};

export const restoreInventoryStock = async (order) => {
  try {
    console.log(`\n📦 [INVENTORY ENGINE] restoreInventoryStock called for Order #${order.orderNumber}`);
    if (!order || !order.items || order.items.length === 0) return;

    for (const item of order.items) {
      if (!item.productId) continue;

      const product = await Product.findById(item.productId);
      if (!product) continue;

      // 1. Direct Product Stock Tracking Restoration
      if (product.trackStock) {
        const updated = await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { stock: item.qty } },
          { new: true }
        );
        console.log(`✅ [INVENTORY ENGINE] Direct stock restored by ${item.qty}. New stock: ${updated.stock}`);
      }

      // 2. Recipe-based Ingredient Stock Tracking Restoration
      if (product.recipe && product.recipe.length > 0) {
        for (const recipeItem of product.recipe) {
          if (!recipeItem.ingredientId) continue;

          const qtyToRestore = recipeItem.quantity * item.qty;

          const updatedIng = await Ingredient.findByIdAndUpdate(
            recipeItem.ingredientId,
            { $inc: { stock: qtyToRestore } },
            { new: true }
          );
          console.log(`✅ [INVENTORY ENGINE] Ingredient ${recipeItem.ingredientId} stock restored by ${qtyToRestore}. New stock: ${updatedIng?.stock}`);
        }
      }
    }
  } catch (error) {
    console.error("❌ [INVENTORY ENGINE] Error restoring inventory stock:", error);
  }
};

export const adjustInventoryStock = async (oldItems, newItems) => {
  try {
    console.log(`\n📦 [INVENTORY ENGINE] adjustInventoryStock called.`);
    const oldQtyMap = {};
    for (const item of oldItems || []) {
      if (!item.productId) continue;
      const key = item.productId._id ? item.productId._id.toString() : item.productId.toString();
      oldQtyMap[key] = (oldQtyMap[key] || 0) + item.qty;
    }

    const newQtyMap = {};
    for (const item of newItems || []) {
      if (!item.productId) continue;
      const key = item.productId._id ? item.productId._id.toString() : item.productId.toString();
      newQtyMap[key] = (newQtyMap[key] || 0) + item.qty;
    }

    // Find all productIds involved
    const allProductIds = new Set([...Object.keys(oldQtyMap), ...Object.keys(newQtyMap)]);

    for (const prodId of allProductIds) {
      const oldQty = oldQtyMap[prodId] || 0;
      const newQty = newQtyMap[prodId] || 0;
      const diff = newQty - oldQty;

      if (diff === 0) continue;

      const product = await Product.findById(prodId);
      if (!product) continue;

      // 1. Direct Product Stock Tracking Adjustments
      if (product.trackStock) {
        const updated = await Product.findByIdAndUpdate(
          prodId,
          { $inc: { stock: -diff } },
          { new: true }
        );
        console.log(`✅ [INVENTORY ENGINE] Direct stock adjusted by ${-diff}. New stock of "${product.name}": ${updated.stock}`);
      }

      // 2. Recipe-based Ingredient Stock Tracking Adjustments
      if (product.recipe && product.recipe.length > 0) {
        for (const recipeItem of product.recipe) {
          if (!recipeItem.ingredientId) continue;
          const qtyToChange = recipeItem.quantity * diff;
          
          const updatedIng = await Ingredient.findByIdAndUpdate(
            recipeItem.ingredientId,
            { $inc: { stock: -qtyToChange } },
            { new: true }
          );
          console.log(`✅ [INVENTORY ENGINE] Ingredient ${recipeItem.ingredientId} stock adjusted by ${-qtyToChange}. New stock: ${updatedIng?.stock}`);
        }
      }
    }
  } catch (error) {
    console.error("❌ [INVENTORY ENGINE] Error adjusting inventory stock:", error);
  }
};
