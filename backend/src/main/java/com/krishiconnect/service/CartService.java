package com.krishiconnect.service;

import com.krishiconnect.entity.*;
import com.krishiconnect.repository.*;
import com.krishiconnect.dto.CartDtos.ItemRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;

@Service
public class CartService {
    private final CartRepository carts; private final CartItemRepository items; private final UserRepository users; private final ProductRepository products;
    public CartService(CartRepository c,CartItemRepository i,UserRepository u,ProductRepository p){carts=c;items=i;users=u;products=p;}

    private Cart cart(Long uid){
        return carts.findByUserId(uid).orElseGet(() -> {
            Cart c=new Cart(); c.setUser(users.findById(uid).orElseThrow()); return carts.save(c);
        });
    }

    @Transactional
    public Cart add(Long uid,ItemRequest r){
        Cart c=cart(uid);
        Product p=products.findById(r.productId()).orElseThrow(() -> new IllegalArgumentException("Product not found."));
        if(p.getStatus() != com.krishiconnect.domain.ProductStatus.APPROVED) throw new IllegalArgumentException("Product unavailable.");
        CartItem x=items.findByCartIdAndProductId(c.getId(),p.getId()).orElse(null);
        if(x==null){ x=new CartItem(); x.setCart(c); x.setProduct(p); x.setQuantity(0); c.getItems().add(x); }
        x.setQuantity(x.getQuantity()+r.quantity());
        c.setUpdatedAt(Instant.now());
        items.save(x); carts.save(c);
        return c;
    }

    @Transactional(readOnly=true)
    public Cart get(Long uid){ return cart(uid); }

    @Transactional
    public void remove(Long uid,Long productId){
        Cart c=cart(uid);
        items.findByCartIdAndProductId(c.getId(),productId).ifPresent(x -> {
            c.getItems().remove(x); items.delete(x);
        });
        c.setUpdatedAt(Instant.now()); carts.save(c);
    }
}
