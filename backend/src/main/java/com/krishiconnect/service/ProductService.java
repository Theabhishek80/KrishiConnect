package com.krishiconnect.service;

import com.krishiconnect.domain.ProductStatus;
import com.krishiconnect.dto.ProductDtos.CreateRequest;
import com.krishiconnect.entity.Inventory;
import com.krishiconnect.entity.Product;
import com.krishiconnect.entity.ProductImage;
import com.krishiconnect.entity.User;
import com.krishiconnect.repository.CartItemRepository;
import com.krishiconnect.repository.CategoryRepository;
import com.krishiconnect.repository.InventoryRepository;
import com.krishiconnect.repository.OrderItemRepository;
import com.krishiconnect.repository.ProductImageRepository;
import com.krishiconnect.repository.ProductRepository;
import com.krishiconnect.repository.UserRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

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
            ProductRepository products,
            UserRepository users,
            CategoryRepository categories,
            InventoryRepository inventory,
            ProductImageRepository productImages,
            CartItemRepository cartItems,
            OrderItemRepository orderItems,
            ImageKitService imageKitService
    ) {
        this.products = products;
        this.users = users;
        this.categories = categories;
        this.inventory = inventory;
        this.productImages = productImages;
        this.cartItems = cartItems;
        this.orderItems = orderItems;
        this.imageKitService = imageKitService;
    }

    // ============================================================
    // PUBLIC MARKETPLACE
    // ============================================================

    @Transactional(readOnly = true)
    public Page<Product> publicProducts(
            String q,
            int page,
            int size
    ) {

        int safePage = Math.max(page, 0);
        int safeSize = Math.min(
                Math.max(size, 1),
                50
        );

        Pageable pageable = PageRequest.of(
                safePage,
                safeSize,
                Sort.by("createdAt").descending()
        );

        /*
         * ONLY APPROVED PRODUCTS ARE PUBLIC.
         */
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

    // ============================================================
    // CREATE PRODUCT
    // ============================================================

    @Transactional
    public Product create(
            Long farmerId,
            CreateRequest request
    ) {

        if (farmerId == null) {
            throw new IllegalArgumentException(
                    "Farmer authentication is required."
            );
        }

        if (request == null) {
            throw new IllegalArgumentException(
                    "Product data is required."
            );
        }

        // --------------------------------------------------------
        // FARMER
        // --------------------------------------------------------

        User farmer = users.findById(farmerId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Farmer not found."
                        )
                );

        if (farmer.getRole() !=
                com.krishiconnect.domain.Role.FARMER) {

            throw new IllegalArgumentException(
                    "Only farmers can create products."
            );
        }

        // --------------------------------------------------------
        // VALIDATION
        // --------------------------------------------------------

        if (request.name() == null ||
                request.name().isBlank()) {

            throw new IllegalArgumentException(
                    "Product name is required."
            );
        }

        if (request.description() == null ||
                request.description().isBlank()) {

            throw new IllegalArgumentException(
                    "Product description is required."
            );
        }

        if (request.price() == null ||
                request.price().signum() < 0) {

            throw new IllegalArgumentException(
                    "Product price must be zero or greater."
            );
        }

        if (request.unit() == null ||
                request.unit().isBlank()) {

            throw new IllegalArgumentException(
                    "Product unit is required."
            );
        }

        if (request.categoryId() == null) {

            throw new IllegalArgumentException(
                    "Product category is required."
            );
        }

        if (request.quantity() < 0) {

            throw new IllegalArgumentException(
                    "Product quantity cannot be negative."
            );
        }

        // --------------------------------------------------------
        // CATEGORY
        // --------------------------------------------------------

        var category = categories.findById(
                request.categoryId()
        ).orElseThrow(() ->
                new IllegalArgumentException(
                        "Selected category was not found."
                )
        );

        // --------------------------------------------------------
        // PRODUCT
        // --------------------------------------------------------

        Product product = new Product();

        product.setFarmer(farmer);

        product.setCategory(category);

        product.setName(
                request.name().trim()
        );

        product.setDescription(
                request.description().trim()
        );

        product.setPrice(
                request.price()
        );

        product.setUnit(
                request.unit().trim()
        );

        /*
         * IMPORTANT:
         *
         * Farmer-created products are NEVER immediately public.
         *
         * PENDING_APPROVAL
         *        ↓
         * ADMIN APPROVES
         *        ↓
         * APPROVED
         */
        product.setStatus(
                ProductStatus.PENDING_APPROVAL
        );

        // --------------------------------------------------------
        // SAVE PRODUCT
        // --------------------------------------------------------

        Product savedProduct =
                products.save(product);

        products.flush();

        // --------------------------------------------------------
        // INVENTORY
        // --------------------------------------------------------

        Inventory inv = new Inventory();

        inv.setProduct(savedProduct);

        inv.setQuantity(
                request.quantity()
        );

        inventory.save(inv);

        return savedProduct;
    }

    // ============================================================
    // ADD PRODUCT IMAGE
    // ============================================================

    @Transactional
    public ProductImage addProductImage(
            Long farmerId,
            Long productId,
            MultipartFile image
    ) {

        if (farmerId == null) {
            throw new IllegalArgumentException(
                    "Farmer authentication is required."
            );
        }

        if (productId == null) {
            throw new IllegalArgumentException(
                    "Product ID is required."
            );
        }

        if (image == null ||
                image.isEmpty()) {

            throw new IllegalArgumentException(
                    "Please select an image."
            );
        }

        Product product =
                products.findById(productId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Product not found."
                                )
                        );

        // --------------------------------------------------------
        // OWNER CHECK
        // --------------------------------------------------------

        if (product.getFarmer() == null ||
                product.getFarmer().getId() == null ||
                !product.getFarmer()
                        .getId()
                        .equals(farmerId)) {

            throw new IllegalArgumentException(
                    "You can only upload images for your own products."
            );
        }

        // --------------------------------------------------------
        // IMAGE UPLOAD
        // --------------------------------------------------------

        String imageUrl =
                imageKitService.uploadProductImage(
                        image,
                        productId
                );

        if (imageUrl == null ||
                imageUrl.isBlank()) {

            throw new IllegalStateException(
                    "Image upload failed."
            );
        }

        // --------------------------------------------------------
        // SAVE IMAGE
        // --------------------------------------------------------

        ProductImage productImage =
                new ProductImage();

        productImage.setProduct(product);

        productImage.setUrl(
                imageUrl
        );

        int sortOrder =
                (int) productImages.countByProductId(
                        productId
                );

        productImage.setSortOrder(
                sortOrder
        );

        return productImages.save(
                productImage
        );
    }

    // ============================================================
    // FARMER PRODUCTS
    // ============================================================

    @Transactional(readOnly = true)
    public Page<Product> farmerProducts(
            Long farmerId
    ) {

        if (farmerId == null) {
            throw new IllegalArgumentException(
                    "Farmer authentication is required."
            );
        }

        return products.findByFarmerId(
                farmerId,
                PageRequest.of(
                        0,
                        100,
                        Sort.by(
                                "createdAt"
                        ).descending()
                )
        );
    }

    // ============================================================
    // DELETE PRODUCT - FARMER
    // ============================================================

    @Transactional
    public String deleteProduct(
            Long farmerId,
            Long productId
    ) {

        if (farmerId == null) {
            throw new IllegalArgumentException(
                    "Farmer authentication is required."
            );
        }

        Product product =
                products.findById(productId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Product not found."
                                )
                        );

        // --------------------------------------------------------
        // OWNER CHECK
        // --------------------------------------------------------

        if (product.getFarmer() == null ||
                product.getFarmer().getId() == null ||
                !product.getFarmer()
                        .getId()
                        .equals(farmerId)) {

            throw new IllegalArgumentException(
                    "You can only delete your own products."
            );
        }

        return deleteProductSafely(product);
    }

    // ============================================================
    // DELETE PRODUCT - ADMIN
    // ============================================================

    @Transactional
    public String deleteProductAsAdmin(
            Long productId
    ) {

        Product product =
                products.findById(productId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Product not found."
                                )
                        );

        return deleteProductSafely(product);
    }

    // ============================================================
    // SAFE DELETE
    // ============================================================

    private String deleteProductSafely(
            Product product
    ) {

        Long productId =
                product.getId();

        // --------------------------------------------------------
        // REMOVE FROM CART
        // --------------------------------------------------------

        cartItems.deleteByProductId(
                productId
        );

        // --------------------------------------------------------
        // PRODUCTS WITH ORDER HISTORY
        // --------------------------------------------------------

        /*
         * If customers already ordered this product,
         * don't physically delete it.
         *
         * Keep the product for order history.
         */
        if (orderItems.existsByProductId(productId)) {

            product.setStatus(
                    ProductStatus.INACTIVE
            );

            products.save(product);

            return "Product archived because it has order history.";
        }

        // --------------------------------------------------------
        // DELETE INVENTORY
        // --------------------------------------------------------

        inventory.deleteByProductId(
                productId
        );

        // --------------------------------------------------------
        // DELETE IMAGES
        // --------------------------------------------------------

        productImages.deleteByProductId(
                productId
        );

        // --------------------------------------------------------
        // DELETE PRODUCT
        // --------------------------------------------------------

        products.delete(product);

        return "Product deleted successfully.";
    }
}
