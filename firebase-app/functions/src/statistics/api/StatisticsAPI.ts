import express = require("express");
import cors = require("cors");
import {
  AddressController, FrequencyController, ReferralController,
} from "./controllers";

/**
 * Onboarding Callable
 */
export class StatisticsAPI {
  private app: express.Express;

  /**
   * Constructor for health2earn API.
   */
  constructor() {
    // Express
    this.app = express();
    this.app.use(cors({origin: true}));
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    /**
     * Main route
     */
    this.app.get("/", (req: express.Request, res: express.Response) => {
      res.send("Hi!");
    });

    /**
     * API routes
     */
    this.app.use("/topPaidAddresses", new AddressController().getRouter());
    this.app.use("/frequency", new FrequencyController().getRouter());
    this.app.use("/referrals", new ReferralController().getRouter());
  }

  /**
   * Get express instance.
   * @return {any} the express app instance.
   */
  public getApp(): express.Express {
    return this.app;
  }
}
