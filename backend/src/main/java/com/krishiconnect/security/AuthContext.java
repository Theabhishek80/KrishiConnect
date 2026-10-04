package com.krishiconnect.security;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
@Component
public class AuthContext {
 public Long userId(Authentication a) {
   if(a==null || a.getDetails()==null) throw new org.springframework.security.authentication.BadCredentialsException("Authentication required");
   return (Long)a.getDetails();
 }
}
