package com.krishiconnect.service;
import com.krishiconnect.entity.*; import com.krishiconnect.repository.*; import com.krishiconnect.dto.CartDtos.ItemRequest;
import org.springframework.stereotype.Service; import org.springframework.transaction.annotation.Transactional;
@Service
public class CartService {
 private final CartRepository carts; private final CartItemRepository items; private final UserRepository users; private final ProductRepository products;
 public CartService(CartRepository c,CartItemRepository i,UserRepository u,ProductRepository p){carts=c;items=i;users=u;products=p;}
 private Cart cart(Long uid){return carts.findByUserId(uid).orElseGet(()->{Cart c=new Cart();c.setUser(users.findById(uid).orElseThrow());return carts.save(c);});}
 @Transactional public Cart add(Long uid,ItemRequest r){Cart c=cart(uid); Product p=products.findById(r.productId()).orElseThrow(); if(!"APPROVED".equals(p.getStatus().name())) throw new IllegalArgumentException("Product unavailable");
   CartItem x=items.findByCartIdAndProductId(c.getId(),p.getId()).orElseGet(()->{CartItem n=new CartItem();n.setCart(c);n.setProduct(p);return n;});
   x.setQuantity(x.getQuantity()+r.quantity());items.save(x);return c;}
 public Cart get(Long uid){return cart(uid);}
 @Transactional public void remove(Long uid,Long productId){Cart c=cart(uid);items.findByCartIdAndProductId(c.getId(),productId).ifPresent(items::delete);}
}
