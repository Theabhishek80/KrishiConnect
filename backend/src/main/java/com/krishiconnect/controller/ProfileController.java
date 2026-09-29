package com.krishiconnect.controller;


import com.krishiconnect.service.ImageKitService;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;

import com.krishiconnect.entity.User;
import com.krishiconnect.repository.UserRepository;
import com.krishiconnect.security.AuthContext;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/profile")
@PreAuthorize("isAuthenticated()")
public class ProfileController {

    private final UserRepository users;
private final AuthContext context;
private final ImageKitService imageKitService;

   public ProfileController(
        UserRepository users,
        AuthContext context,
        ImageKitService imageKitService
) {
    this.users = users;
    this.context = context;
    this.imageKitService = imageKitService;
}

    // Get logged-in user's profile
    @GetMapping
    public Map<String, Object> getProfile(
            Authentication authentication
    ) {

        Long userId = context.userId(authentication);

        User user = users.findById(userId)
                .orElseThrow(() ->
                        new IllegalStateException(
                                "User profile not found."
                        )
                );

        return profileResponse(user);
    }

    // Update name and phone
    @PutMapping
    public Map<String, Object> updateProfile(
            Authentication authentication,
            @RequestBody Map<String, String> request
    ) {

        Long userId = context.userId(authentication);

        User user = users.findById(userId)
                .orElseThrow(() ->
                        new IllegalStateException(
                                "User profile not found."
                        )
                );

        String name = request.get("name");
        String phone = request.get("phone");

        if (name != null && !name.isBlank()) {
            user.setName(name.trim());
        }

        if (phone != null) {
            user.setPhone(phone.trim());
        }

        User savedUser = users.save(user);

        return profileResponse(savedUser);
    }


    @PostMapping(
        value = "/image",
        consumes = MediaType.MULTIPART_FORM_DATA_VALUE
)
public Map<String, Object> uploadProfileImage(
        Authentication authentication,
        @RequestParam("image") MultipartFile image
) {

    Long userId = context.userId(authentication);

    User user = users.findById(userId)
            .orElseThrow(() ->
                    new IllegalStateException(
                            "User profile not found."
                    )
            );

    String imageUrl =
            imageKitService.uploadProfileImage(image, userId);

    user.setProfileImageUrl(imageUrl);

    User savedUser = users.save(user);

    return profileResponse(savedUser);
}

    private Map<String, Object> profileResponse(User user) {

        return Map.of(
                "id", user.getId(),
                "name", user.getName(),
                "email", user.getEmail(),
                "phone", user.getPhone() == null ? "" : user.getPhone(),
                "profileImageUrl",
                    user.getProfileImageUrl() == null
                        ? ""
                        : user.getProfileImageUrl(),
                "role", user.getRole().name(),
                "emailVerified", user.isEmailVerified()
        );
    }
}
