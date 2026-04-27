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

HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/api/actuator/health/readiness" | grep -q '"status":"UP"' || exit 1

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -XX:MaxRAMPercentage=${JAVA_MAX_RAM_PERCENTAGE} -XX:InitialRAMPercentage=${JAVA_INITIAL_RAM_PERCENTAGE} -XX:+ExitOnOutOfMemoryError -Djava.security.egd=file:/dev/./urandom -jar /app/app.jar"]
