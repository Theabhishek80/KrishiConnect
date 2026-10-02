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
    private final ImageKitService imageKitService;

    public ProductService(
            ProductRepository p,
            UserRepository u,
            CategoryRepository c,
            InventoryRepository i,
            ProductImageRepository pi,
            ImageKitService ik
    ) {
        products = p;
        users = u;
        categories = c;
        inventory = i;
        productImages = pi;
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

        return (q == null || q.isBlank())
                ? products.findByStatus(ProductStatus.APPROVED, pageable)
                : products.findByStatusAndNameContainingIgnoreCase(
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
        p.setDescription(r.description().trim());
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
                imageKitService.uploadProductImage(image, productId);

        ProductImage productImage = new ProductImage();

        productImage.setProduct(product);
        productImage.setUrl(imageUrl);
        productImage.setSortOrder(0);

        return productImages.save(productImage);
    }

    // DELETE PRODUCT - FARMER CAN DELETE ONLY THEIR OWN PRODUCT
    @Transactional
    public void deleteProduct(Long farmerId, Long productId) {

        Product product = products.findById(productId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Product not found."
                        )
                );

        if (!product.getFarmer().getId().equals(farmerId)) {
            throw new IllegalArgumentException(
                    "You can only delete your own products."
            );
        }

        products.delete(product);
    }

    // GET PRODUCTS CREATED BY THE LOGGED-IN FARMER
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
