/**
 * Coupon scope validation utility.
 * Determines if coupon applies to given items and computes matching subtotal.
 */

/**
 * @param {Object} coupon - Coupon document from DB
 * @param {Array} items - Cart/order items, each with { product, price, quantity }
 *   product can be an ObjectId, a populated doc { _id, category, brand }, or null
 * @returns {{ valid: boolean, reason: string|null, matchingSubtotal: number }}
 */
function validateCouponScope(coupon, items) {
  if (!items || items.length === 0) {
    return { valid: false, reason: 'Cart is empty', matchingSubtotal: 0 };
  }

  if (coupon.minItemCount > 0 && items.length < coupon.minItemCount) {
    return { valid: false, reason: `Minimum ${coupon.minItemCount} items required`, matchingSubtotal: 0 };
  }

  if (coupon.applicableTo === 'all') {
    const subtotal = items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
    return { valid: true, reason: null, matchingSubtotal: subtotal };
  }

  const matchingItems = items.filter((item) => {
    const product = item.product || {};
    const productId = (product._id || product).toString();
    const category = product.category || '';
    const brand = product.brand || '';

    if (coupon.excludedProductIds && coupon.excludedProductIds.length > 0) {
      const isExcluded = coupon.excludedProductIds.some(
        (exId) => exId.toString() === productId,
      );
      if (isExcluded) return false;
    }

    if (coupon.excludedCategoryIds && coupon.excludedCategoryIds.length > 0) {
      if (coupon.excludedCategoryIds.includes(category)) return false;
    }

    if (coupon.applicableTo === 'products') {
      return coupon.productIds && coupon.productIds.some(
        (pid) => pid.toString() === productId,
      );
    }

    if (coupon.applicableTo === 'categories') {
      return coupon.categoryIds && coupon.categoryIds.includes(category);
    }

    if (coupon.applicableTo === 'brands') {
      return coupon.brandIds && coupon.brandIds.includes(brand);
    }

    if (coupon.applicableTo === 'services') {
      return coupon.serviceIds && coupon.serviceIds.some(
        (sid) => sid.toString() === productId,
      );
    }

    return false;
  });

  if (matchingItems.length === 0) {
    return { valid: false, reason: 'Coupon does not apply to items in your cart', matchingSubtotal: 0 };
  }

  const matchingSubtotal = matchingItems.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
    0,
  );

  return { valid: true, reason: null, matchingSubtotal };
}

/**
 * Compute discount based on coupon type and matching subtotal.
 */
function computeCouponDiscount(coupon, matchingSubtotal) {
  if (coupon.discountType === 'percentage') {
    let discount = (matchingSubtotal * coupon.discountValue) / 100;
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
    return discount;
  }

  if (coupon.discountType === 'fixed') {
    return matchingSubtotal > 0 ? coupon.discountValue : 0;
  }

  if (coupon.discountType === 'free_shipping') {
    return 0;
  }

  return 0;
}

module.exports = { validateCouponScope, computeCouponDiscount };
