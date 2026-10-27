# Dev image: run the core backend in Docker with the host Docker socket so the
# plugin deployer can spawn per-tenant plugin containers on openerp-net.
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build
COPY pom.xml .
RUN mvn -q -B dependency:go-offline || true
COPY src/ src/
RUN mvn -q -B package -DskipTests -Dquarkus.package.type=fast-jar

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN apk add --no-cache docker-cli \
    && addgroup -S openerp && adduser -S openerp -G openerp
COPY --from=build --chown=openerp:openerp /build/target/quarkus-app/lib/ /app/lib/
COPY --from=build --chown=openerp:openerp /build/target/quarkus-app/*.jar /app/
COPY --from=build --chown=openerp:openerp /build/target/quarkus-app/app/ /app/app/
COPY --from=build --chown=openerp:openerp /build/target/quarkus-app/quarkus/ /app/quarkus/
USER openerp
EXPOSE 8080
ENV JAVA_OPTS="-Dquarkus.http.host=0.0.0.0"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/quarkus-run.jar"]
