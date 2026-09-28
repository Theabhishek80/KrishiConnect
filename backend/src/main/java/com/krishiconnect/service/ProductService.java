package com.krishiconnect.service;
import com.krishiconnect.domain.ProductStatus;
import com.krishiconnect.dto.ProductDtos.*;
import com.krishiconnect.entity.*;
import com.krishiconnect.repository.*;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
@Service
public class ProductService {
 private final ProductRepository products; private final UserRepository users; private final CategoryRepository categories; private final InventoryRepository inventory;
 public ProductService(ProductRepository p,UserRepository u,CategoryRepository c,InventoryRepository i){products=p;users=u;categories=c;inventory=i;}
 public Page<Product> publicProducts(String q,int page,int size) {
   Pageable pageable=PageRequest.of(Math.max(page,0),Math.min(size,50),Sort.by("createdAt").descending());
   return (q==null||q.isBlank())?products.findByStatus(ProductStatus.APPROVED,pageable):products.findByStatusAndNameContainingIgnoreCase(ProductStatus.APPROVED,q,pageable);
 }
 @Transactional public Product create(Long farmerId,CreateRequest r) {
   User farmer=users.findById(farmerId).orElseThrow(); if(farmer.getRole().name().equals("FARMER")==false) throw new IllegalArgumentException("Not a farmer");
   Product p=new Product();p.setFarmer(farmer);p.setName(r.name());p.setDescription(r.description());p.setPrice(r.price());p.setUnit(r.unit());p.setCategory(categories.findById(r.categoryId()).orElseThrow());p.setStatus(ProductStatus.PENDING_APPROVAL);products.save(p);
   Inventory inv=new Inventory();inv.setProduct(p);inv.setQuantity(r.quantity());inventory.save(inv);return p;
 }
