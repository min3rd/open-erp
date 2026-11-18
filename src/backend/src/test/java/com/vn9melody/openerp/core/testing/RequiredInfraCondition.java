package com.vn9melody.openerp.core.testing;

import io.quarkus.test.junit.QuarkusTest;
import java.net.InetSocketAddress;
import java.net.Socket;
import org.junit.jupiter.api.extension.ConditionEvaluationResult;
import org.junit.jupiter.api.extension.ExecutionCondition;
import org.junit.jupiter.api.extension.ExtensionContext;
import org.junit.platform.commons.support.AnnotationSupport;

/**
 * Skips {@link QuarkusTest} classes when the real infrastructure (PostgreSQL + Redis) is not
 * running, so a local build reports skips instead of a Quarkus boot failure.
 *
 * <p>Register once through JUnit extension auto-detection
 * ({@code junit-platform.properties} + {@code META-INF/services}); start the infrastructure
 * with {@code npm run infra} to actually execute these tests. Plain unit tests are unaffected.
 */
public class RequiredInfraCondition implements ExecutionCondition {

    private static final String POSTGRES_HOST = "localhost";
    private static final int POSTGRES_PORT = 5432;
    private static final String REDIS_HOST = "localhost";
    private static final int REDIS_PORT = 6379;

    /** Probed once per test JVM. */
    private static final boolean INFRA_AVAILABLE = isReachable(POSTGRES_HOST, POSTGRES_PORT)
            && isReachable(REDIS_HOST, REDIS_PORT);

    @Override
    public ConditionEvaluationResult evaluateExecutionCondition(ExtensionContext context) {
        Class<?> testClass = context.getTestClass().orElse(null);
        if (testClass == null || !AnnotationSupport.isAnnotated(testClass, QuarkusTest.class)) {
            return ConditionEvaluationResult.enabled("Test does not need the Quarkus infrastructure");
        }
        if (INFRA_AVAILABLE) {
            return ConditionEvaluationResult.enabled("PostgreSQL and Redis are reachable");
        }
        return ConditionEvaluationResult.disabled(
                "PostgreSQL/Redis not reachable on " + POSTGRES_HOST + ":" + POSTGRES_PORT + " / "
                        + REDIS_HOST + ":" + REDIS_PORT + " - run `npm run infra` to execute Quarkus tests");
    }

    private static boolean isReachable(String host, int port) {
        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress(host, port), 1000);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
