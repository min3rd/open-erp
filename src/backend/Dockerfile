# Dev image: run the core backend in Docker with the host Docker socket so the
# plugin deployer can spawn per-tenant plugin containers on openerp-net.
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build
COPY pom.xml .
RUN mvn -q -B dependency:go-offline || true
COPY src/ src/
RUN mvn -q -B package -DskipTests -Dquarkus.package.type=fast-jar

# Docker CLI is copied from the official static image; Alpine JRE crashes in
# the Argon2 JNA native library on musl, so use the glibc-based Temurin image.
FROM docker:27-cli AS dockercli
FROM eclipse-temurin:21-jre
WORKDIR /app
RUN groupadd -r openerp && useradd -r -g openerp openerp
COPY --from=dockercli /usr/local/bin/docker /usr/local/bin/docker
COPY --from=build --chown=openerp:openerp /build/target/quarkus-app/lib/ /app/lib/
COPY --from=build --chown=openerp:openerp /build/target/quarkus-app/*.jar /app/
COPY --from=build --chown=openerp:openerp /build/target/quarkus-app/app/ /app/app/
COPY --from=build --chown=openerp:openerp /build/target/quarkus-app/quarkus/ /app/quarkus/
USER openerp
EXPOSE 8080
ENV JAVA_OPTS="-Dquarkus.http.host=0.0.0.0"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/quarkus-run.jar"]
