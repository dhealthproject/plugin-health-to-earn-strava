import {Request, Response, Router} from "express";
import {FirestoreUtil} from "../utils";

/**
 * Referral controller.
 */
export class ReferralController {
  private router: Router;

  /**
   * Address controller's constructor.
   */
  constructor() {
    this.router = Router();
    this.router.get("/", this.getReferrals());
  }

  /**
   * Returns this controller's router instance.
   * @return {Router} this controller's router instance
   */
  public getRouter(): Router {
    return this.router;
  }

  /**
   * Return response to referrals.
   * @return {Response<any, Record<string, any>>}
   */
  private getReferrals() {
    return async (req: Request, res: Response) => {
      try {
        const result = await this.getReferralsFromFirestore();
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
   * Get referrals from Firebase & return as result.
   * @return {Object}
   */
  private async getReferralsFromFirestore() {
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
