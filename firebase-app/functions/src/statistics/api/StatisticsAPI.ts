/**
 * This file is part of dHealth Wallet Plugins shared under LGPL-3.0
 * Copyright (C) 2021 Using Blockchain Ltd, Reg No.: 12658136, United Kingdom
 *
 * @package     dHealth Wallet Plugins
 * @subpackage  Health to Earn powered by Strava
 * @author      dHealth Network <devs@dhealth.foundation>
 * @license     LGPL-3.0
 */
// external dependencies
import express = require("express");
import cors = require("cors");

// internal dependencies
import {
  AddressController, FrequencyController, ReferralController,
} from "./controllers";

/**
 * Onboarding Callable.
 */
export class StatisticsAPI {

  /**
   * {@link Express} instance.
   *
   * @access private
   * @var {Express}
   */
  private app: express.Express;

  /**
   * Constructor for health2earn API.
   */
  constructor() {
    //==================
    // Express config
    //==================
    this.app = express();
    this.app.use(cors({origin: true}));
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    //==================
    // Main route
    //==================
    this.app.get("/", (req: express.Request, res: express.Response) => {
      res.send("Hi!");
    });

    //==================
    // API routes
    //==================
    this.app.use("/topPaidAddresses", new AddressController().getRouter());
    this.app.use("/frequency", new FrequencyController().getRouter());
    this.app.use("/referrals", new ReferralController().getRouter());
  }

  /**
   * Get express instance.
   *
   * @access public
   * @return {Express}
   */
  public getApp(): express.Express {
    return this.app;
  }
}
