package com.vn9melody.openerp.core.security;

import jakarta.enterprise.context.ApplicationScoped;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.List;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

@ApplicationScoped
public class TotpService {
    private static final String BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    private static final int SECRET_BYTE_LENGTH = 20; // 160 bits
    private static final int TIME_STEP_SECONDS = 30;
    private static final int CODE_DIGITS = 6;
    private static final int DIGIT_MODULO = 1_000_000;
    private final SecureRandom secureRandom = new SecureRandom();

    public String generateBase32Secret() {
        byte[] buffer = new byte[SECRET_BYTE_LENGTH];
        secureRandom.nextBytes(buffer);
        return encodeBase32(buffer);
    }

    public String generateQrCodeUri(String email, String secretKey) {
        return String.format("otpauth://totp/OpenERP:%s?secret=%s&issuer=OpenERP", email, secretKey);
    }

    public boolean verifyTotp(String secretKeyBase32, String code) {
        if (secretKeyBase32 == null || code == null || code.trim().length() != CODE_DIGITS) {
            return false;
        }

        String normalizedCode = code.trim();
        byte[] keyBytes = decodeBase32(secretKeyBase32);
        long currentInterval = System.currentTimeMillis() / 1000L / TIME_STEP_SECONDS;

        // Tolerance window: -1, 0, +1 interval (+/- 30 seconds drift tolerance)
        for (int i = -1; i <= 1; i++) {
            String calculatedCode = String.format("%0" + CODE_DIGITS + "d", calculateTotpCode(keyBytes, currentInterval + i));
            if (MessageDigest.isEqual(
                    calculatedCode.getBytes(StandardCharsets.UTF_8),
                    normalizedCode.getBytes(StandardCharsets.UTF_8))) {
                return true;
            }
        }
        return false;
    }

    public String generateCurrentCode(String secretKeyBase32) {
        if (secretKeyBase32 == null || secretKeyBase32.isBlank()) {
            return null;
        }
        long currentInterval = System.currentTimeMillis() / 1000L / TIME_STEP_SECONDS;
        return String.format("%0" + CODE_DIGITS + "d", calculateTotpCode(decodeBase32(secretKeyBase32), currentInterval));
    }

    public List<String> generateBackupCodes(int count) {
        List<String> codes = new ArrayList<>(count);
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        for (int i = 0; i < count; i++) {
            StringBuilder sb = new StringBuilder();
            for (int j = 0; j < 8; j++) {
                if (j == 4) {
                    sb.append('-');
                }
                sb.append(chars.charAt(secureRandom.nextInt(chars.length())));
            }
            codes.add(sb.toString());
        }
        return codes;
    }

    public String hashBackupCode(String rawCode) {
        String normalized = rawCode.replace("-", "").trim().toUpperCase();
        return sha256Hex(normalized);
    }

    public String sha256Hex(String input) {
        if (input == null) {
            throw new IllegalArgumentException("Input cannot be null");
        }
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(digest.length * 2);
            for (byte b : digest) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    private int calculateTotpCode(byte[] key, long interval) {
        try {
            byte[] data = ByteBuffer.allocate(8).putLong(interval).array();
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(key, "HmacSHA1"));
            byte[] hash = mac.doFinal(data);

            int offset = hash[hash.length - 1] & 0x0F;
            long truncatedHash = ((hash[offset] & 0x7F) << 24)
                    | ((hash[offset + 1] & 0xFF) << 16)
                    | ((hash[offset + 2] & 0xFF) << 8)
                    | (hash[offset + 3] & 0xFF);

            return (int) (truncatedHash % DIGIT_MODULO);
        } catch (Exception e) {
            throw new RuntimeException("Error calculating TOTP code", e);
        }
    }

    private String encodeBase32(byte[] data) {
        StringBuilder sb = new StringBuilder((data.length * 8 + 4) / 5);
        int buffer = 0;
        int next = 0;
        int bitsLeft = 0;

        while (next < data.length) {
            buffer <<= 8;
            buffer |= data[next++] & 0xFF;
            bitsLeft += 8;
            while (bitsLeft >= 5) {
                bitsLeft -= 5;
                int index = (buffer >> bitsLeft) & 0x1F;
                sb.append(BASE32_ALPHABET.charAt(index));
            }
        }
        if (bitsLeft > 0) {
            buffer <<= (5 - bitsLeft);
            int index = buffer & 0x1F;
            sb.append(BASE32_ALPHABET.charAt(index));
        }
        return sb.toString();
    }

    private byte[] decodeBase32(String base32) {
        String clean = base32.trim().toUpperCase().replaceAll("[^A-Z2-7]", "");
        byte[] result = new byte[clean.length() * 5 / 8];
        int buffer = 0;
        int bitsLeft = 0;
        int index = 0;

        for (int i = 0; i < clean.length(); i++) {
            char c = clean.charAt(i);
            int val = BASE32_ALPHABET.indexOf(c);
            if (val < 0) continue;

            buffer <<= 5;
            buffer |= val & 0x1F;
            bitsLeft += 5;
            if (bitsLeft >= 8) {
                bitsLeft -= 8;
                if (index < result.length) {
                    result[index++] = (byte) ((buffer >> bitsLeft) & 0xFF);
                }
            }
        }
        return result;
    }
}
