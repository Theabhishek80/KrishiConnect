package com.krishiconnect.service;

import com.krishiconnect.domain.ProductStatus;
import com.krishiconnect.dto.CartDtos;
import com.krishiconnect.dto.CartDtos.ItemRequest;
import com.krishiconnect.dto.CartDtos.QuantityRequest;
import com.krishiconnect.entity.Cart;
import com.krishiconnect.entity.CartItem;
import com.krishiconnect.entity.Product;
import com.krishiconnect.repository.CartItemRepository;
import com.krishiconnect.repository.CartRepository;
import com.krishiconnect.repository.ProductRepository;
import com.krishiconnect.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Service
public class CartService {

    private final CartRepository carts;
    private final CartItemRepository items;
    private final UserRepository users;
    private final ProductRepository products;

    public CartService(
            CartRepository carts,
            CartItemRepository items,
            UserRepository users,
            ProductRepository products
    ) {
        this.carts = carts;
        this.items = items;
        this.users = users;
        this.products = products;
    }

    private Cart cart(Long uid) {
        return carts.findByUserId(uid)
                .orElseGet(() -> {
                    Cart c = new Cart();

                    c.setUser(
                            users.findById(uid)
                                    .orElseThrow()
                    );

                    return carts.save(c);
                });
    }

    @Transactional
    public CartDtos.CartResponse add(
            Long uid,
            ItemRequest request
    ) {
        Cart cart = cart(uid);

        Product product = products.findById(request.productId())
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Product not found."
                        )
                );

        if (product.getStatus() != ProductStatus.APPROVED) {
            throw new IllegalArgumentException(
                    "Product unavailable."
            );
        }

        CartItem item =
                items.findByCartIdAndProductId(
                        cart.getId(),
                        product.getId()
                ).orElse(null);

        if (item == null) {
            item = new CartItem();

            item.setCart(cart);
            item.setProduct(product);
            item.setQuantity(0);

            cart.getItems().add(item);
        }

        item.setQuantity(
                item.getQuantity() + request.quantity()
        );

        cart.setUpdatedAt(Instant.now());

        items.save(item);
        carts.save(cart);

        return toResponse(cart);
    }

    @Transactional(readOnly = true)
    public CartDtos.CartResponse get(Long uid) {
        Cart cart = cart(uid);

        return toResponse(cart);
    }

    @Transactional
    public CartDtos.CartResponse updateQuantity(
            Long uid,
            Long productId,
            QuantityRequest request
    ) {
        Cart cart = cart(uid);

        CartItem item =
                items.findByCartIdAndProductId(
                        cart.getId(),
                        productId
                ).orElseThrow(() ->
                        new IllegalArgumentException(
                                "Product is not in your cart."
                        )
                );

        item.setQuantity(request.quantity());

        cart.setUpdatedAt(Instant.now());

        items.save(item);
        carts.save(cart);

        return toResponse(cart);
    }

    @Transactional
    public void remove(
            Long uid,
            Long productId
    ) {
        Cart cart = cart(uid);

        items.findByCartIdAndProductId(
                cart.getId(),
                productId
        ).ifPresent(item -> {
            cart.getItems().remove(item);
            items.delete(item);
        });

        cart.setUpdatedAt(Instant.now());

        carts.save(cart);
    }

    private CartDtos.CartResponse toResponse(Cart cart) {

        List<CartDtos.CartItemResponse> itemResponses =
                cart.getItems()
                        .stream()
                        .map(this::toItemResponse)
                        .toList();

        BigDecimal total =
                itemResponses.stream()
                        .map(CartDtos.CartItemResponse::subtotal)
                        .reduce(
                                BigDecimal.ZERO,
                                BigDecimal::add
                        );

        return new CartDtos.CartResponse(
                cart.getId(),
                itemResponses,
                total
        );
    }

    private CartDtos.CartItemResponse toItemResponse(
            CartItem item
    ) {
        Product product = item.getProduct();

        List<String> images =
                product.getImages()
                        .stream()
                        .map(image -> image.getUrl())
                        .toList();

        CartDtos.ProductResponse productResponse =
                new CartDtos.ProductResponse(
                        product.getId(),
                        product.getName(),
                        product.getDescription(),
                        product.getPrice(),
                        product.getUnit(),
                        images
                );

        BigDecimal subtotal =
                product.getPrice()
                        .multiply(
                                BigDecimal.valueOf(
                                        item.getQuantity()
                                )
                        );

        return new CartDtos.CartItemResponse(
                item.getId(),
                productResponse,
                item.getQuantity(),
                subtotal
        );
    }
}
