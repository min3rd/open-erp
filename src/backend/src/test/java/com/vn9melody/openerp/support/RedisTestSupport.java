package com.vn9melody.openerp.support;

import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.redis.datasource.keys.KeyCommands;
import java.util.List;

public final class RedisTestSupport {

    private static final String[] KEY_PATTERNS = {
        "otp:verify:*",
        "otp:resend:*",
        "preauth:*",
        "session:*",
        "user:*:sessions",
        "bruteforce:attempts:*",
        "bruteforce:lock:*",
        "blacklist:token:*",
        "2fa:setup:*"
    };

    private RedisTestSupport() {}

    public static void clearAll(RedisDataSource redis) {
        KeyCommands<String> keys = redis.key(String.class);
        for (String pattern : KEY_PATTERNS) {
            List<String> found = keys.keys(pattern);
            if (found != null && !found.isEmpty()) {
                keys.del(found.toArray(new String[0]));
            }
        }
    }
}
