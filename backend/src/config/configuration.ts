export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,

  // Public web app base URL used to construct invitation links.
  // - Production should set PUBLIC_WEB_URL to an externally reachable address.
  // - FRONTEND_URL is supported for backwards compatibility.
  publicWebUrl:
    (process.env.PUBLIC_WEB_URL || "").trim().replace(/\/+$/, "") ||
    (process.env.FRONTEND_URL || "").trim().replace(/\/+$/, "") ||
    "http://localhost:3001",

  // Neo4j Configuration
  neo4j: {
    uri: process.env.NEO4J_URI || "bolt://localhost:7687",
    user: process.env.NEO4J_USER || "neo4j",
    password: process.env.NEO4J_PASSWORD || "password",
  },

  // PostgreSQL Configuration
  postgres: {
    host: process.env.POSTGRES_HOST || "localhost",
    port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
    database: process.env.POSTGRES_DB || "identity_service",
    user: process.env.POSTGRES_USER || "postgres",
    password: process.env.POSTGRES_PASSWORD || "password",
  },

  // JWT Configuration (for future use)
  jwt: {
    secret: process.env.JWT_SECRET || "your-secret-key-change-in-production",
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  },
});
