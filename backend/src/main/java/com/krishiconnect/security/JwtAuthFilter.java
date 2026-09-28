package com.krishiconnect.security;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
@Component
public class JwtAuthFilter extends OncePerRequestFilter {
 private final JwtService jwt;
 public JwtAuthFilter(JwtService jwt) { this.jwt=jwt; }
 protected void doFilterInternal(HttpServletRequest req,HttpServletResponse res,FilterChain chain) throws java.io.IOException,ServletException {
   String h=req.getHeader("Authorization");
   if(h!=null && h.startsWith("Bearer ")) {
     try {
       var c=jwt.parse(h.substring(7));
       var auth=new UsernamePasswordAuthenticationToken(c.getSubject(),null,
          java.util.List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_"+c.get("role",String.class))));
       auth.setDetails(c.get("uid",Long.class)); SecurityContextHolder.getContext().setAuthentication(auth);
     } catch(Exception ignored) {}
   }
   chain.doFilter(req,res);
 }
}
