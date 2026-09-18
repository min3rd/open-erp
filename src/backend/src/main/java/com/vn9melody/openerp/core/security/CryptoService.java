package com.vn9melody.openerp.core.security;

import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import org.eclipse.microprofile.config.inject.ConfigProperty;

@ApplicationScoped
public class CryptoService {
    private static final String TRANSFORMATION = "AES/GCM/NoPadding";
    private static final String ALGORITHM = "AES";
    private static final int IV_LENGTH_BYTES = 12;
    private static final int TAG_LENGTH_BITS = 128;
    private static final int AES_256_KEY_BYTES = 32;

    @ConfigProperty(name = "openerp.security.aes-key")
    String aesKeyBase64;

    private final SecureRandom secureRandom = new SecureRandom();
    private byte[] keyBytes;

    @PostConstruct
    void init() {
        this.keyBytes = decodeKey(aesKeyBase64);
    }

    public String encrypt(String plaintext) {
        if (plaintext == null) {
            throw new IllegalArgumentException("Plaintext cannot be null");
        }
        try {
            byte[] iv = new byte[IV_LENGTH_BYTES];
            secureRandom.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(keyBytes, ALGORITHM), new GCMParameterSpec(TAG_LENGTH_BITS, iv));
            byte[] ciphertext = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

            ByteBuffer buffer = ByteBuffer.allocate(iv.length + ciphertext.length);
            buffer.put(iv);
            buffer.put(ciphertext);
            return Base64.getEncoder().encodeToString(buffer.array());
        } catch (Exception e) {
            throw new IllegalStateException("AES-256-GCM encryption failed", e);
        }
    }

    public String decrypt(String payload) {
        if (payload == null || payload.isBlank()) {
            throw new IllegalArgumentException("Ciphertext cannot be blank");
        }
        try {
            byte[] decoded = Base64.getDecoder().decode(payload);
            if (decoded.length <= IV_LENGTH_BYTES) {
                throw new IllegalArgumentException("Ciphertext is too short to contain IV and tag");
            }

            byte[] iv = new byte[IV_LENGTH_BYTES];
            System.arraycopy(decoded, 0, iv, 0, IV_LENGTH_BYTES);
            byte[] ciphertext = new byte[decoded.length - IV_LENGTH_BYTES];
            System.arraycopy(decoded, IV_LENGTH_BYTES, ciphertext, 0, ciphertext.length);

            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.DECRYPT_MODE, new SecretKeySpec(keyBytes, ALGORITHM), new GCMParameterSpec(TAG_LENGTH_BITS, iv));
            return new String(cipher.doFinal(ciphertext), StandardCharsets.UTF_8);
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException(
                "AES-256-GCM decryption failed: the openerp.security.aes-key is incorrect or the ciphertext is corrupted", e);
        }
    }

    private byte[] decodeKey(String base64Key) {
        if (base64Key == null || base64Key.isBlank()) {
            throw new IllegalStateException("openerp.security.aes-key must be configured with a Base64-encoded 32-byte key");
        }
        byte[] decoded;
        try {
            decoded = Base64.getDecoder().decode(base64Key.trim());
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException("openerp.security.aes-key is not valid Base64", e);
        }
        if (decoded.length != AES_256_KEY_BYTES) {
            throw new IllegalStateException(
                "openerp.security.aes-key must decode to exactly 32 bytes for AES-256, but got " + decoded.length + " bytes");
        }
        return decoded;
    }
}
