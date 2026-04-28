# syntax=docker/dockerfile:1

FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /workspace

COPY pom.xml .
RUN mvn -B -ntp dependency:go-offline

COPY src ./src
RUN mvn -B -ntp clean package -DskipTests && \
    cp target/event-app-tracker-*.jar /workspace/app.jar

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

RUN addgroup -S spring && adduser -S spring -G spring

ENV PORT=8080 \
    JAVA_MAX_RAM_PERCENTAGE=65 \
    JAVA_INITIAL_RAM_PERCENTAGE=25 \
    JAVA_OPTS=""

COPY --from=build --chown=spring:spring /workspace/app.jar /app/app.jar

USER spring:spring

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
    CMD wget -qO- "http://127.0.0.1:${PORT}/api/actuator/health" | grep -q '"status":"UP"' || exit 1

ENTRYPOINT ["sh", "-c", "exec java \
  -XX:+UseSerialGC \
  -XX:TieredStopAtLevel=1 \
  -Xms64m \
  -Xmx220m \
  -XX:MaxMetaspaceSize=128m \
  -XX:ReservedCodeCacheSize=32m \
  -XX:+ExitOnOutOfMemoryError \
  -XX:+TieredCompilation \
  -Djava.security.egd=file:/dev/./urandom \
  -Dspring.jmx.enabled=false \
  -Dfile.encoding=UTF-8 \
  $JAVA_OPTS \
  -jar /app/app.jar"]
