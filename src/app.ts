import express, { Application } from "express";
import cors from "cors";
import path from "path";
import { createServer, Server } from "http";
import routesUser from "./routes/user.routes";
import routesPost from "./routes/post.routes";
import routesNotifications from "./routes/notifications.routes";

export class App {
  private app: Application;
  private httpServer: Server;

  private apiRoutes = {
    user: "/api",
    post: "/api",
    notification: "/api",
    challenge: "/api",
  };

  constructor() {
    this.app = express();

    this.httpServer = createServer(this.app);

    this.middlewares();
    this.routes();
  }

  private middlewares() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: false }));
    this.app.use(express.static(path.resolve("uploads/profile")));
    this.app.use(express.static(path.resolve("uploads/profile/cover")));
    this.app.use(express.static(path.resolve("uploads/posts")));
  }

  private routes() {
    this.app.use(this.apiRoutes.user, routesUser);
    this.app.use(this.apiRoutes.post, routesPost);
    this.app.use(this.apiRoutes.notification, routesNotifications);
  }

  async listen(port: string): Promise<void> {
    await this.httpServer.listen(port);
    console.log(`SERVER RUN ON PORT Welcome  ${port}`);
  }
}
