import { createApplication, getApplicationsByUserId } from "./server/db";
import "dotenv/config";

async function testAppCreation() {
  console.log("Testing application creation in JSON DB...");
  const userId = 1;
  const newApp = await createApplication({
    userId,
    eventName: "Test Hackathon",
    eventType: "Hackathon",
    status: "Interested",
    notes: "Trying out the mock DB",
    url: "https://example.com"
  });
  console.log("Created application:", newApp);

  const apps = await getApplicationsByUserId(userId);
  console.log("Found applications for user 1:", apps);
}

testAppCreation().catch(console.error);
