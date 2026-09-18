package com.vn9melody.openerp.core.security;

import de.mkammerer.argon2.Argon2;
import de.mkammerer.argon2.Argon2Factory;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class PasswordHashService {
    private static final int SALT_LENGTH = 16;
    private static final int HASH_LENGTH = 32;
    private static final int ITERATIONS = 2;
    private static final int MEMORY_KIB = 19456;
    private static final int PARALLELISM = 1;

    private final Argon2 argon2 = Argon2Factory.create(Argon2Factory.Argon2Types.ARGON2id, SALT_LENGTH, HASH_LENGTH);

    public String hashPassword(String plainPassword) {
        if (plainPassword == null || plainPassword.isBlank()) {
            throw new IllegalArgumentException("Password cannot be blank");
        }
        return argon2.hash(ITERATIONS, MEMORY_KIB, PARALLELISM, plainPassword.toCharArray());
    }

    public boolean checkPassword(String plainPassword, String hashedPassword) {
        if (plainPassword == null || hashedPassword == null || hashedPassword.isBlank()) {
            return false;
        }
        try {
            return argon2.verify(hashedPassword, plainPassword.toCharArray());
        } catch (Exception e) {
            return false;
        }
    }
}
