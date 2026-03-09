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

  // Enable CORS for development (allow all local network origins)
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or Postman)
      if (!origin) return callback(null, true);

      // Allow localhost and local network IPs (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
      if (
        origin.includes("localhost") ||
        origin.includes("127.0.0.1") ||
        origin.match(/http:\/\/192\.168\.\d+\.\d+/) ||
        origin.match(/http:\/\/10\.\d+\.\d+\.\d+/) ||
        origin.match(/http:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+/)
      ) {
        callback(null, true);
      } else {
        console.warn("[CORS] Blocked origin:", origin);
        callback(new Error("Not allowed by CORS"));
      }
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
