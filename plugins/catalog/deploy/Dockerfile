# UI bundle is built inside the image so local/CI output matches the deployed
# plugin container instead of relying on a host `ng build`.
FROM node:22-alpine AS ui
WORKDIR /app
COPY src/frontend/web/package.json src/frontend/web/package-lock.json ./src/frontend/web/
RUN cd src/frontend/web && npm ci
COPY src/frontend/web ./src/frontend/web
COPY src/frontend/shared ./src/frontend/shared
COPY plugins/catalog/web ./plugins/catalog/web
RUN ln -s /app/src/frontend/web/node_modules /app/node_modules
RUN ln -s /app/src/frontend/web/node_modules /app/plugins/catalog/web/node_modules
RUN cd src/frontend/web && npx ng build catalog-plugin

FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build
COPY plugins/catalog/pom.xml .
RUN mvn -q -B dependency:go-offline || true
COPY plugins/catalog/src/ src/
COPY --from=ui /app/plugins/catalog/src/main/resources/META-INF/resources/ src/main/resources/META-INF/resources/
RUN mvn -q -B package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S openerp && adduser -S openerp -G openerp
COPY --from=build --chown=openerp:openerp /build/target/quarkus-app/lib/ /app/lib/
COPY --from=build --chown=openerp:openerp /build/target/quarkus-app/*.jar /app/
COPY --from=build --chown=openerp:openerp /build/target/quarkus-app/app/ /app/app/
COPY --from=build --chown=openerp:openerp /build/target/quarkus-app/quarkus/ /app/quarkus/
USER openerp
EXPOSE 8080
ENV JAVA_OPTS="-Dquarkus.http.host=0.0.0.0"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/quarkus-run.jar"]
