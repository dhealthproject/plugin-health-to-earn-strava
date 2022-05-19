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
import { DayReward } from "../models";

/**
 * Frequency controller.
 */
export class FrequencyController {
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
    this.router.get("/", this.getTotalRewards7Days);
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
   * @async
   * @param {Request}   req
   * @param {Response}  res
   * @return {Promise<void>}
   */
  private getTotalRewards7Days = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.get7DaysTransactions();
      res.status(200).send({success: true, result: result});
    } catch (err) {
      if (err instanceof Error) {
        res.status(400).send({success: false, error: err.message});
      } else {
        res.status(400).send({success: false, error: err});
      }
    }
  }

  /**
   * Returns top paid addresses from DB.
   *
   * @access private
   * @async
   * @return {Promise<DayReward>}
   */
  private async get7DaysTransactions(): Promise<DayReward> {
    const result: any = {};
    for (let i = 0; i < 7; i++) {
      const myCurrentDate = new Date();
      const myPastDate=new Date(myCurrentDate);
      myPastDate.setDate(myPastDate.getDate() - i);
      const dateStr = this.formatDate(myPastDate);
      const resultSnapshot = await FirestoreUtil.getDocumentInCollection(
          "transactions-async-by-date", dateStr
      );
      const resultOfDate: any = resultSnapshot.data();
      result[dateStr] = {
        averageReward: resultOfDate.amount / resultOfDate.count,
        totalRewards: resultOfDate.amount,
        totalTransactions: resultOfDate.count
      }
    }
    return result;
  }

  /**
   * Return date formatted in 'yyyyMMdd'.
   *
   * @access private
   * @param {Date}    date
   * @return {string}
   */
  private formatDate(date: Date): string {
    let month = "" + (date.getUTCMonth() + 1);
    let day = "" + date.getUTCDate();
    const year = date.getUTCFullYear();
    if (month.length < 2) {
      month = "0" + month;
    }
    if (day.length < 2) {
      day = "0" + day;
    }
    return `${year}${month}${day}`;
  }
}
