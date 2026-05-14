import express from "express";
import cors from "cors";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // CORS configuration
  // Allow the new domain and the local dev environment
  const allowedOrigins = [
    "https://nearbyexchange.com",
    "https://the-tamarind-connect.vercel.app",
    "http://localhost:3000"
  ];

  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith(".run.app")) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  }));

  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Backend is running and CORS is configured for nearbyexchange.com" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Bind to 0.0.0.0 to be accessible on all network interfaces
  const host = "0.0.0.0";

  // Only start the server if this file is run directly (not as a module)
  // In a bundled environment (like Vercel or Cloud Run), we might just need the app object
  // On Vercel, we don't want to call listen() as it's a serverless environment
  if (!process.env.VERCEL && (process.env.NODE_ENV === "production" || !process.env.VITE_DEV_SERVER_ONLY)) {
    app.listen(PORT, host, () => {
      console.log(`Server running on http://${host}:${PORT}`);
      console.log(`CORS allowed origins: ${allowedOrigins.join(", ")}`);
    });
  }

  return app;
}

export const appPromise = startServer();
