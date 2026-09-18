package com.vn9melody.openerp.core.security;

import jakarta.enterprise.context.ApplicationScoped;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@ApplicationScoped
public class BruteForceService {
    private static final int MAX_ATTEMPTS = 5;
    private static final long LOCK_DURATION_SECONDS = 900; // 15 mins

    private static class AttemptTracker {
        int attempts = 0;
        Instant lockedUntil = null;
        Instant lastAttempt = Instant.now();
    }

    private final Map<String, AttemptTracker> attemptsMap = new ConcurrentHashMap<>();

    public boolean isLocked(String email) {
        if (email == null) return false;
        AttemptTracker tracker = attemptsMap.get(email.toLowerCase().trim());
        if (tracker == null) return false;

        if (tracker.lockedUntil != null) {
            if (Instant.now().isBefore(tracker.lockedUntil)) {
                return true;
            } else {
                // Lock expired -> reset
                tracker.attempts = 0;
                tracker.lockedUntil = null;
                return false;
            }
        }
        return false;
    }

    public long getRemainingLockSeconds(String email) {
        if (email == null) return 0;
        AttemptTracker tracker = attemptsMap.get(email.toLowerCase().trim());
        if (tracker == null || tracker.lockedUntil == null) return 0;
        long remaining = tracker.lockedUntil.getEpochSecond() - Instant.now().getEpochSecond();
        return Math.max(0, remaining);
    }

    public void recordFailedAttempt(String email) {
        if (email == null) return;
        String key = email.toLowerCase().trim();
        attemptsMap.compute(key, (k, tracker) -> {
            if (tracker == null) {
                tracker = new AttemptTracker();
            }
            tracker.attempts++;
            tracker.lastAttempt = Instant.now();
            if (tracker.attempts >= MAX_ATTEMPTS) {
                tracker.lockedUntil = Instant.now().plusSeconds(LOCK_DURATION_SECONDS);
            }
            return tracker;
        });
    }

    public void resetAttempts(String email) {
        if (email != null) {
            attemptsMap.remove(email.toLowerCase().trim());
        }
    }
}
