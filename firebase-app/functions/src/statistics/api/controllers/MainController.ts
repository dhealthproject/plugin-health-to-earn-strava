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
import {Request, Response, Router} from "express";

/**
 * Address controller.
 */
export class MainController {

  /**
   * {@link Router} instance for this controller.
   *
   * @var {Router}
   * @access private
   */
  private router: Router;

  /**
   * App information contains in package.json.
   *
   * @var {object}
   * @access private
   */
  private packageJson = require('../../../../package.json');

  /**
   * Address controller's constructor.
   */
  constructor() {
    this.router = Router();
    this.router.get("/", this.getAppInformation);
  }

  /**
   * Returns this controller's router instance.
   *
   * @access public
   * @return {Router}
   */
  public getRouter(): Router {
    return this.router;
  }

  /**
   * Return App's information.
   *
   * @access private
   * @async
   * @param   {Request}   req
   * @param   {Response}  res
   * @returns {void}
   */
  private getAppInformation = (req: Request, res: Response): void => {
    res.status(200).send(this.packageJson);
  };
}