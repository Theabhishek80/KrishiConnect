package com.krishiconnect.security;
import com.krishiconnect.entity.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import java.util.*;
public record SecurityUser(User user) implements UserDetails {
 public Collection<? extends GrantedAuthority> getAuthorities() { return List.of(new SimpleGrantedAuthority("ROLE_"+user.getRole().name())); }
 public String getPassword() { return user.getPasswordHash(); }
 public String getUsername() { return user.getEmail(); }
 public boolean isEnabled() { return user.isEnabled(); }
}
