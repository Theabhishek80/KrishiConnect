package com.krishiconnect.controller;
import com.krishiconnect.service.ProductService; import com.krishiconnect.dto.ProductDtos.*; import com.krishiconnect.entity.Product; import jakarta.validation.Valid; import org.springframework.data.domain.Page; import org.springframework.web.bind.annotation.*; import org.springframework.security.core.Authentication;
@RestController @RequestMapping("/api/products")
public class ProductController {
 private final ProductService service; private final com.krishiconnect.security.AuthContext context;
 public ProductController(ProductService s,com.krishiconnect.security.AuthContext c){service=s;context=c;}
 @GetMapping public Page<Product> list(@RequestParam(defaultValue="") String q,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="12") int size){return service.publicProducts(q,page,size);}
 @PostMapping("/farmer") @org.springframework.security.access.prepost.PreAuthorize("hasRole('FARMER')") public Product create(Authentication a,@Valid @RequestBody CreateRequest r){return service.create(context.userId(a),r);}
}
