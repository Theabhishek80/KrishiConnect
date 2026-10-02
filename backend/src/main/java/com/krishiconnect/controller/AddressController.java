package com.krishiconnect.controller;

import com.krishiconnect.entity.Address;
import com.krishiconnect.entity.User;
import com.krishiconnect.repository.AddressRepository;
import com.krishiconnect.repository.UserRepository;
import com.krishiconnect.security.AuthContext;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/addresses")
public class AddressController {
    private final AddressRepository addresses; private final UserRepository users; private final AuthContext context;
    public AddressController(AddressRepository a,UserRepository u,AuthContext c){addresses=a;users=u;context=c;}
    public record AddressRequest(@NotBlank String label,@NotBlank String recipientName,@NotBlank String phone,@NotBlank String line1,String line2,@NotBlank String city,@NotBlank String state,@NotBlank String postalCode,String country,boolean defaultAddress){}
    @GetMapping public List<Address> list(Authentication a){return addresses.findByUserIdOrderByDefaultAddressDescIdDesc(context.userId(a));}
    @PostMapping public Address create(Authentication a,@Valid @RequestBody AddressRequest r){
        Long uid=context.userId(a); User user=users.findById(uid).orElseThrow();
        if(r.defaultAddress() || addresses.countByUserId(uid)==0) clearDefaults(uid);
        Address x=from(r); x.setUser(user); if(addresses.countByUserId(uid)==0)x.setDefaultAddress(true); return addresses.save(x);
    }
    @PutMapping("/{id}") public Address update(Authentication a,@PathVariable Long id,@Valid @RequestBody AddressRequest r){
        Address x=owned(id,context.userId(a)); if(r.defaultAddress())clearDefaults(x.getUser().getId()); copy(x,r); return addresses.save(x);
    }
    @DeleteMapping("/{id}") public void delete(Authentication a,@PathVariable Long id){addresses.delete(owned(id,context.userId(a)));}
    @PatchMapping("/{id}/default") public Address makeDefault(Authentication a,@PathVariable Long id){Address x=owned(id,context.userId(a));clearDefaults(x.getUser().getId());x.setDefaultAddress(true);return addresses.save(x);}
    private Address owned(Long id,Long uid){Address x=addresses.findById(id).orElseThrow(()->new IllegalArgumentException("Address not found."));if(!x.getUser().getId().equals(uid))throw new org.springframework.security.access.AccessDeniedException("Forbidden");return x;}
    private void clearDefaults(Long uid){addresses.findByUserIdOrderByDefaultAddressDescIdDesc(uid).forEach(x->{x.setDefaultAddress(false);addresses.save(x);});}
    private Address from(AddressRequest r){Address x=new Address();copy(x,r);return x;}
    private void copy(Address x,AddressRequest r){x.setLabel(r.label().trim());x.setRecipientName(r.recipientName().trim());x.setPhone(r.phone().trim());x.setLine1(r.line1().trim());x.setLine2(r.line2());x.setCity(r.city().trim());x.setState(r.state().trim());x.setPostalCode(r.postalCode().trim());x.setCountry(r.country()==null||r.country().isBlank()?"India":r.country().trim());x.setDefaultAddress(r.defaultAddress());}
}
