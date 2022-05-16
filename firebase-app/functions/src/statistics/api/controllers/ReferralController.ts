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
import {FirestoreUtil} from "../utils";

/**
 * Referral controller.
 */
export class ReferralController {

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
        await this.getReferrals(req, res)
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
   * Return response to referrals.
   *
   * @access private
   * @async
   * @return {Promise<void>}
   */
  private async getReferrals(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.getReferralsFromFirestore();
      res.status(200).send({success: true, result: result});
    } catch (err) {
      if (err instanceof Error) {
        res.status(400).send({success: false, error: err.message});
      }
      res.status(400).send({success: false, error: err});
    }
  }

  /**
   * Get referrals from Firebase & return as result.
   *
   * @access private
   * @async
   * @return {Promise<object>}
   */
  private async getReferralsFromFirestore(): Promise<object> {
    const result:any = {};
    const resultSnapshot =
      await FirestoreUtil.getDocumentsInCollection("referrals-async");
    resultSnapshot.forEach((doc: any) => {
      const referrer = doc.data().referrer;
      if (!result[referrer]) {
        result[referrer] = [];
      }
      result[referrer].push(doc.data());
    });
    return result;
  }
}
