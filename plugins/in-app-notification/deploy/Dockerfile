# UI bundle is built inside the image so local/CI output matches the deployed plugin.
FROM node:22-alpine AS ui
WORKDIR /app
COPY src/frontend/web/package.json src/frontend/web/package-lock.json ./src/frontend/web/
RUN cd src/frontend/web && npm ci
COPY src/frontend/web ./src/frontend/web
COPY src/frontend/shared ./src/frontend/shared
COPY plugins/in-app-notification/web ./plugins/in-app-notification/web
RUN ln -s /app/src/frontend/web/node_modules /app/node_modules
RUN ln -s /app/src/frontend/web/node_modules /app/plugins/in-app-notification/web/node_modules
RUN cd src/frontend/web && npx ng build notification-plugin

# Shared plugin SDK + notification plugin backend.
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build
COPY plugins/pom.xml .
COPY plugins/sdk/pom.xml sdk/pom.xml
COPY plugins/catalog/pom.xml catalog/pom.xml
COPY plugins/in-app-notification/pom.xml in-app-notification/pom.xml
RUN mvn -q -B -pl in-app-notification -am dependency:go-offline || true
COPY plugins/sdk/src/ sdk/src/
COPY plugins/in-app-notification/src/ in-app-notification/src/
COPY --from=ui /app/plugins/in-app-notification/src/main/resources/META-INF/resources/ in-app-notification/src/main/resources/META-INF/resources/
RUN mvn -q -B -pl in-app-notification -am package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S openerp && adduser -S openerp -G openerp
COPY --from=build --chown=openerp:openerp /build/in-app-notification/target/quarkus-app/lib/ /app/lib/
COPY --from=build --chown=openerp:openerp /build/in-app-notification/target/quarkus-app/*.jar /app/
COPY --from=build --chown=openerp:openerp /build/in-app-notification/target/quarkus-app/app/ /app/app/
COPY --from=build --chown=openerp:openerp /build/in-app-notification/target/quarkus-app/quarkus/ /app/quarkus/
USER openerp
EXPOSE 8080
ENV JAVA_OPTS="-Dquarkus.http.host=0.0.0.0"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/quarkus-run.jar"]
