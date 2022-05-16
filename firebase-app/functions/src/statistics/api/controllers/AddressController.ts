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

// internal dependencies
import { TopPaidAddress } from "../models";
import {FirestoreUtil} from "../utils";

/**
 * Address controller.
 */
export class AddressController {

  /**
   * {@link Router} instance for this controller.
   *
   * @var {Router}
   * @access private
   */
  private router: Router;

  /**
   * Address controller's constructor.
   */
  constructor() {
    this.router = Router();
    this.router.get(
      "/",
      async (req: Request, res: Response) =>
        await this.getTopPaidAddressesRoute(req, res)
    );
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
   * Returns top paid addresses.
   *
   * @access private
   * @return {Promise<void>}
   */
  private async getTopPaidAddressesRoute(req: Request, res: Response) {
    try {
      const result = await this.getTopPaidAddresses();
      res.status(200).send({success: true, result: result});
    } catch (err) {
      if (err instanceof Error) {
        res.status(400).send({success: false, error: err.message});
      }
      res.status(400).send({success: false, error: err});
    }
  }

  /**
   * Returns top paid addresses from DB
   *
   * @access private
   * @return {Promise<TopPaidAddress>}
   */
  private async getTopPaidAddresses(): Promise<TopPaidAddress> {
    const result:any = [];
    const resultSnapshot =
      await FirestoreUtil.getDocumentsInCollection("addresses-async", "amount", "desc", 20);
    resultSnapshot.forEach((doc) => {
      result.push({ address: doc.id, totalReward: doc.data().amount});
    });
    return result;
  }
}
