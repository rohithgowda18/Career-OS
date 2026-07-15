export interface CatalogSkill {
  name: string;
  category: "BACKEND" | "FRONTEND" | "DATABASE" | "DEVOPS" | "CLOUD" | "COMPUTER_SCIENCE" | "AI_ML" | "MOBILE" | "TESTING" | "OTHER";
}

export const SKILL_CATALOG: CatalogSkill[] = [
  // Backend
  { name: "Java", category: "BACKEND" },
  { name: "Spring Boot", category: "BACKEND" },
  { name: "Hibernate", category: "BACKEND" },
  { name: "REST APIs", category: "BACKEND" },
  { name: "JWT", category: "BACKEND" },
  { name: "OAuth2", category: "BACKEND" },
  { name: "Node.js", category: "BACKEND" },
  { name: "Express", category: "BACKEND" },
  { name: "NestJS", category: "BACKEND" },
  { name: "Flask", category: "BACKEND" },
  { name: "Django", category: "BACKEND" },
  { name: "FastAPI", category: "BACKEND" },

  // Frontend
  { name: "React", category: "FRONTEND" },
  { name: "HTML", category: "FRONTEND" },
  { name: "CSS", category: "FRONTEND" },
  { name: "JavaScript", category: "FRONTEND" },
  { name: "TypeScript", category: "FRONTEND" },
  { name: "TailwindCSS", category: "FRONTEND" },
  { name: "Bootstrap", category: "FRONTEND" },
  { name: "Vite", category: "FRONTEND" },
  { name: "Next.js", category: "FRONTEND" },
  { name: "Vue", category: "FRONTEND" },
  { name: "Angular", category: "FRONTEND" },
  { name: "Redux", category: "FRONTEND" },

  // Database
  { name: "PostgreSQL", category: "DATABASE" },
  { name: "MySQL", category: "DATABASE" },
  { name: "MongoDB", category: "DATABASE" },
  { name: "Redis", category: "DATABASE" },
  { name: "Cassandra", category: "DATABASE" },
  { name: "SQLite", category: "DATABASE" },
  { name: "Firebase", category: "DATABASE" },

  // DevOps
  { name: "Git", category: "DEVOPS" },
  { name: "GitHub", category: "DEVOPS" },
  { name: "GitLab", category: "DEVOPS" },
  { name: "Docker", category: "DEVOPS" },
  { name: "Kubernetes", category: "DEVOPS" },
  { name: "Jenkins", category: "DEVOPS" },
  { name: "Maven", category: "DEVOPS" },
  { name: "Gradle", category: "DEVOPS" },
  { name: "Linux", category: "DEVOPS" },
  { name: "CI/CD", category: "DEVOPS" },
  { name: "Terraform", category: "DEVOPS" },
  { name: "GitHub Actions", category: "DEVOPS" },

  // Cloud
  { name: "AWS", category: "CLOUD" },
  { name: "Azure", category: "CLOUD" },
  { name: "Google Cloud", category: "CLOUD" },
  { name: "Vercel", category: "CLOUD" },
  { name: "Render", category: "CLOUD" },
  { name: "Netlify", category: "CLOUD" },
  { name: "Cloudflare", category: "CLOUD" },

  // Computer Science
  { name: "Data Structures", category: "COMPUTER_SCIENCE" },
  { name: "Algorithms", category: "COMPUTER_SCIENCE" },
  { name: "Object-Oriented Programming", category: "COMPUTER_SCIENCE" },
  { name: "DBMS", category: "COMPUTER_SCIENCE" },
  { name: "Operating Systems", category: "COMPUTER_SCIENCE" },
  { name: "Computer Networks", category: "COMPUTER_SCIENCE" },
  { name: "Design Patterns", category: "COMPUTER_SCIENCE" },
  { name: "System Design", category: "COMPUTER_SCIENCE" },
  { name: "Microservices", category: "COMPUTER_SCIENCE" },

  // AI / Machine Learning
  { name: "Python", category: "AI_ML" },
  { name: "Machine Learning", category: "AI_ML" },
  { name: "Artificial Intelligence", category: "AI_ML" },
  { name: "Deep Learning", category: "AI_ML" },
  { name: "TensorFlow", category: "AI_ML" },
  { name: "PyTorch", category: "AI_ML" },
  { name: "R", category: "AI_ML" },

  // Mobile
  { name: "Kotlin", category: "MOBILE" },
  { name: "Swift", category: "MOBILE" },
  { name: "Flutter", category: "MOBILE" },
  { name: "React Native", category: "MOBILE" },
  { name: "Android Development", category: "MOBILE" },
  { name: "iOS Development", category: "MOBILE" },

  // Testing
  { name: "JUnit", category: "TESTING" },
  { name: "Mockito", category: "TESTING" },
  { name: "Selenium", category: "TESTING" },
  { name: "Playwright", category: "TESTING" },
  { name: "Cypress", category: "TESTING" },

  // Others
  { name: "Postman", category: "OTHER" },
  { name: "IntelliJ IDEA", category: "OTHER" },
  { name: "VS Code", category: "OTHER" },
  { name: "JIRA", category: "OTHER" },
  { name: "Agile Methodology", category: "OTHER" },
  { name: "Scrum", category: "OTHER" },
  { name: "Unit Testing", category: "OTHER" },
  { name: "Integration Testing", category: "OTHER" },
];

export const RECOMMENDATION_MAP: Record<string, string[]> = {
  Java: ["Spring Security", "Docker", "JUnit"],
  React: ["TypeScript", "Redux"],
  Docker: ["Kubernetes"],
  "Spring Boot": ["JUnit", "Docker", "Redis"],
  Git: ["GitHub Actions"]
};
