package com.smartcampus.api.service;

import com.smartcampus.api.dto.PushSubscriptionRequest;
import com.smartcampus.api.exception.ResourceNotFoundException;
import com.smartcampus.api.model.PushSubscription;
import com.smartcampus.api.model.User;
import com.smartcampus.api.repository.PushSubscriptionRepository;
import com.smartcampus.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PushSubscriptionService {

    private final PushSubscriptionRepository repository;
    private final UserRepository userRepository;

    @Transactional
    public void subscribe(Long userId, PushSubscriptionRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        // Re-subscription from the same browser — update in place.
        PushSubscription sub = repository.findByEndpoint(req.getEndpoint())
                .orElseGet(() -> PushSubscription.builder().endpoint(req.getEndpoint()).build());
        sub.setUser(user);
        sub.setP256dh(req.getP256dh());
        sub.setAuth(req.getAuth());
        sub.setUserAgent(req.getUserAgent());
        repository.save(sub);
    }

    @Transactional
    public void unsubscribe(String endpoint) {
        repository.deleteByEndpoint(endpoint);
    }
}
