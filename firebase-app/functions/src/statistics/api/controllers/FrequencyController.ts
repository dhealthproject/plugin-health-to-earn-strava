import {Request, Response, Router} from "express";
import {FirestoreUtil} from "../utils";
// import * as admin from "firebase-admin";

/**
 * Address controller.
 */
export class FrequencyController {
    private router: Router;

    /**
     * Address controller's constructor.
     */
    constructor() {
      this.router = Router();
      this.router.get("/", this.getTotalRewards7Days());
    }

    /**
     * Returns this controller's router instance.
     * @return {Router} this controller's router instance
     */
    public getRouter(): Router {
      return this.router;
    }

    /**
     * Returns top paid addresses.
     * @return {Response<any, Record<string, any>>}
     */
    private getTotalRewards7Days() {
      return async (req: Request, res: Response) => {
        try {
          const result = await this.get7DaysTransactions();
          return res.status(200).send({success: true, result: result});
        } catch (err) {
          if (err instanceof Error) {
            return res.status(400).send({success: false, error: err.message});
          }
          return res.status(400).send({success: false, error: err});
        }
      };
    }

    /**
     * Returns top paid addresses from DB
     * @return {any}
     */
    private async get7DaysTransactions() {
      const result: any = {};
      for (let i = 0; i < 7; i++) {
        const myCurrentDate = new Date();
        const myPastDate=new Date(myCurrentDate);
        myPastDate.setDate(myPastDate.getDate() - i);
        const dateStr = this.formatDate(myPastDate);
        const resultSnapshot = await FirestoreUtil.getDocumentInCollection(
            "transactions-async-by-date", dateStr
        );
        result[dateStr] = resultSnapshot.data();
      }
      return result;
    }

    /**
     * Return date formatted in 'yyyyMMdd'.
     * @param {Date} date
     * @return {string} result in string
     */
    private formatDate(date: Date) {
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
