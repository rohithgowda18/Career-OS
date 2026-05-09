# TODO - Spring Native .env Support (Better)

- [ ] Add `spring.config.import=optional:file:.env[.properties]` to `apps/backend/src/main/resources/application.yml` (and `application-prod.yml` if needed)
- [ ] Remove custom `.env` loader: delete `apps/backend/src/main/java/com/eventtracker/config/DotenvConfig.java`
- [ ] Remove `dotenv-java` dependency from `apps/backend/pom.xml`
- [ ] Run Maven build/tests for backend (`mvn -q test`)
