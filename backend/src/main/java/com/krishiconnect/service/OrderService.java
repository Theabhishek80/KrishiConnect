package com.krishiconnect.service;
import com.krishiconnect.entity.*; import com.krishiconnect.domain.*; import com.krishiconnect.repository.*; import com.krishiconnect.dto.OrderDtos.*;
import org.springframework.stereotype.Service; import org.springframework.transaction.annotation.Transactional; import java.math.BigDecimal;
@Service
public class OrderService {
 private final OrderRepository orders; private final CartRepository carts; private final CartItemRepository items; private final InventoryRepository inventory; private final UserRepository users;
 public OrderService(OrderRepository o,CartRepository c,CartItemRepository i,InventoryRepository inv,UserRepository u){orders=o;carts=c;items=i;inventory=inv;users=u;}
 @Transactional public java.util.List<Order> checkout(Long uid,CheckoutRequest req) {
   Cart cart=carts.findByUserId(uid).orElseThrow(()->new IllegalArgumentException("Cart is empty"));
   var cartItems=items.findByCartId(cart.getId());
   if(cartItems.isEmpty()) throw new IllegalArgumentException("Cart is empty");
   java.util.Map<Long,Order> byFarmer=new java.util.HashMap<>();
   for(CartItem ci:cartItems){
     var inv=inventory.findByProductId(ci.getProduct().getId()).orElseThrow();
     if(inv.getQuantity()<ci.getQuantity()) throw new IllegalArgumentException("Insufficient stock for "+ci.getProduct().getName());
     inv.setQuantity(inv.getQuantity()-ci.getQuantity()); inventory.save(inv);
     Long fid=ci.getProduct().getFarmer().getId();
     Order o=byFarmer.computeIfAbsent(fid,k->{Order n=new Order();n.setConsumer(users.findById(uid).orElseThrow());n.setFarmer(ci.getProduct().getFarmer());n.setStatus(OrderStatus.PLACED);n.setTotalAmount(BigDecimal.ZERO);n.setShippingAddress(req.shippingAddress());return n;});
     o.setTotalAmount(o.getTotalAmount().add(ci.getProduct().getPrice().multiply(BigDecimal.valueOf(ci.getQuantity())))); orders.save(o);
   }
   items.deleteAll(cartItems); return new java.util.ArrayList<>(byFarmer.values());
 }
 public java.util.List<Order> consumerOrders(Long uid){return orders.findByConsumerIdOrderByCreatedAtDesc(uid);}
 public java.util.List<Order> farmerOrders(Long uid){return orders.findByFarmerIdOrderByCreatedAtDesc(uid);}
 @Transactional public Order updateStatus(Long farmerId,Long orderId,StatusRequest r){Order o=orders.findById(orderId).orElseThrow();if(!o.getFarmer().getId().equals(farmerId))throw new org.springframework.security.access.AccessDeniedException("Forbidden");o.setStatus(OrderStatus.valueOf(r.status()));return orders.save(o);}
}
