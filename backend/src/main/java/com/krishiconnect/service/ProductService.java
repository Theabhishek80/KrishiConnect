package com.krishiconnect.service;

import org.springframework.web.multipart.MultipartFile;

import com.krishiconnect.domain.ProductStatus;
import com.krishiconnect.dto.ProductDtos.*;
import com.krishiconnect.entity.*;
import com.krishiconnect.repository.*;

import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProductService {

    private final ProductRepository products;
    private final UserRepository users;
    private final CategoryRepository categories;
    private final InventoryRepository inventory;
    private final ProductImageRepository productImages;
    private final CartItemRepository cartItems;
    private final OrderItemRepository orderItems;
    private final ImageKitService imageKitService;

    public ProductService(
            ProductRepository p,
            UserRepository u,
            CategoryRepository c,
            InventoryRepository i,
            ProductImageRepository pi,
            CartItemRepository ci,
            OrderItemRepository oi,
            ImageKitService ik
    ) {
        products = p;
        users = u;
        categories = c;
        inventory = i;
        productImages = pi;
        cartItems = ci;
        orderItems = oi;
        imageKitService = ik;
    }

    public Page<Product> publicProducts(String q, int page, int size) {

        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 50);

        Pageable pageable = PageRequest.of(
                safePage,
                safeSize,
                Sort.by("createdAt").descending()
        );

        if (q == null || q.isBlank()) {
            return products.findByStatus(
                    ProductStatus.APPROVED,
                    pageable
            );
        }

        return products.findByStatusAndNameContainingIgnoreCase(
                ProductStatus.APPROVED,
                q.trim(),
                pageable
        );
    }

    @Transactional
    public Product create(Long farmerId, CreateRequest r) {

        User farmer = users.findById(farmerId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Farmer not found."
                        )
                );

        if (farmer.getRole() != com.krishiconnect.domain.Role.FARMER) {
            throw new IllegalArgumentException(
                    "Only farmers can create products."
            );
        }

        Product p = new Product();

        p.setFarmer(farmer);
        p.setName(r.name().trim());
        p.setDescription(
                r.description() == null
                        ? ""
                        : r.description().trim()
        );
        p.setPrice(r.price());
        p.setUnit(r.unit().trim());

        p.setCategory(
                categories.findById(r.categoryId())
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Category not found."
                                )
                        )
        );

        /*
         * New farmer products should not immediately appear
         * in the public marketplace.
         *
         * They first go to admin approval.
         */
        p.setStatus(ProductStatus.PENDING_APPROVAL);

        products.save(p);

        Inventory inv = new Inventory();
        inv.setProduct(p);
        inv.setQuantity(r.quantity());

        inventory.save(inv);

        return p;
    }

    @Transactional
    public ProductImage addProductImage(
            Long farmerId,
            Long productId,
            MultipartFile image
    ) {

        Product product = products.findById(productId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Product not found."
                        )
                );

        if (!product.getFarmer().getId().equals(farmerId)) {
            throw new IllegalArgumentException(
                    "You can only upload images for your own products."
            );
        }

        String imageUrl =
                imageKitService.uploadProductImage(
                        image,
                        productId
                );

        ProductImage productImage = new ProductImage();

        productImage.setProduct(product);
        productImage.setUrl(imageUrl);
        productImage.setSortOrder(0);

        return productImages.save(productImage);
    }

    /*
     * ============================================================
     * FARMER PRODUCT DELETE
     * ============================================================
     *
     * Farmer can delete only their own product.
     *
     * Before deleting:
     * 1. Remove the product from customers' carts.
     * 2. Check whether the product exists in order history.
     * 3. If it has order history, archive it instead of deleting it.
     * 4. Otherwise permanently delete it.
     */
    @Transactional
    public String deleteProduct(
            Long farmerId,
            Long productId
    ) {

        Product product = products.findById(productId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Product not found."
                        )
                );

        if (product.getFarmer() == null ||
                !product.getFarmer().getId().equals(farmerId)) {

            throw new IllegalArgumentException(
                    "You can only delete your own products."
            );
        }

        return deleteProductSafely(product);
    }

    /*
     * ============================================================
     * ADMIN PRODUCT DELETE
     * ============================================================
     */
    @Transactional
    public String deleteProductAsAdmin(Long productId) {

        Product product = products.findById(productId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Product not found."
                        )
                );

        return deleteProductSafely(product);
    }

    /*
     * ============================================================
     * SAFE DELETE LOGIC
     * ============================================================
     */
    private String deleteProductSafely(Product product) {

        Long productId = product.getId();

        /*
         * IMPORTANT:
         *
         * A product can exist inside a customer's cart.
         * Delete those cart rows first so the database
         * foreign-key constraint does not stop deletion.
         */
        cartItems.deleteByProductId(productId);

        /*
         * IMPORTANT:
         *
         * If this product has already been purchased,
         * DO NOT physically delete it.
         *
         * Existing orders may reference this product.
         *
         * Instead mark it INACTIVE.
         */
        if (orderItems.existsByProductId(productId)) {

            product.setStatus(ProductStatus.INACTIVE);

            products.save(product);

            return "Product archived because it has order history.";
        }

        /*
         * No order history:
         *
         * Product can safely be permanently deleted.
         */
        products.delete(product);

        return "Product deleted successfully.";
    }

    /*
     * ============================================================
     * FARMER PRODUCTS
     * ============================================================
     */
    public Page<Product> farmerProducts(Long farmerId) {

        return products.findByFarmerId(
                farmerId,
                PageRequest.of(
                        0,
                        100,
                        Sort.by("createdAt").descending()
                )
        );
    }
}
