import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ["error", "warn", "log", "debug"],
  });

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      whitelist: false,
      forbidNonWhitelisted: false,
    }),
  );

  // Enable CORS
  // - Supports explicit allowlist via env (recommended for production)
  // - Also permits localhost/private-network origins for local development
  const normalizeOrigin = (value: string) => value.trim().replace(/\/+$/, "");
  const parseOrigins = (value?: string) =>
    (value ?? "")
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean)
      .map(normalizeOrigin);

  const configuredOrigins = new Set([
    ...parseOrigins(process.env.CORS_ORIGIN),
    ...parseOrigins(process.env.CORS_ORIGINS),
  ]);

  const isProduction = process.env.NODE_ENV === "production";

  const isLocalDevOrigin = (origin: string) => {
    const normalized = normalizeOrigin(origin);
    return (
      normalized.includes("localhost") ||
      normalized.includes("127.0.0.1") ||
      /^http:\/\/192\.168\.\d+\.\d+(?::\d+)?$/.test(normalized) ||
      /^http:\/\/10\.\d+\.\d+\.\d+(?::\d+)?$/.test(normalized) ||
      /^http:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+(?::\d+)?$/.test(normalized)
    );
  };

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);

      const normalized = normalizeOrigin(origin);

      if (configuredOrigins.size > 0 && configuredOrigins.has(normalized)) {
        return callback(null, true);
      }

      if (!isProduction && isLocalDevOrigin(normalized)) {
        return callback(null, true);
      }

      console.warn("[CORS] Blocked origin:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  });

  // Configure Swagger
  const config = new DocumentBuilder()
    .setTitle("Multi-Sport Athlete Injury Surveillance System API")
    .setDescription("API documentation for the Injury Surveillance System")
    .setVersion("1.0")
    .addTag("auth", "Authentication endpoints")
    .addTag("injuries", "Injury management endpoints")
    .addTag("players", "Player information endpoints")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "JWT",
        description: "Enter JWT token",
        in: "header",
      },
      "JWT-auth",
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: "alpha",
      operationsSorter: "alpha",
    },
    customSiteTitle: "Injury Surveillance API Docs",
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 50px 0 }
      .swagger-ui .info .title { color: #E0234E }
    `,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port, "0.0.0.0"); // Listen on all network interfaces

  console.log(`🚀 Backend server is running on: http://localhost:${port}`);
  console.log(`📱 Mobile devices can connect to: http://192.168.0.109:${port}`);
  console.log(
    `📚 API Documentation available at: http://localhost:${port}/api/docs`,
  );
}

bootstrap();
