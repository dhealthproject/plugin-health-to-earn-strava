import {Request, Response, Router} from "express";
import {FirestoreUtil} from "../utils";

/**
 * Address controller.
 */
export class AddressController {
    private router: Router;

    /**
     * Address controller's constructor.
     */
    constructor() {
      this.router = Router();
      this.router.get("/", this.getTopPaidAddressesRoute());
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
    private getTopPaidAddressesRoute() {
      return async (req: Request, res: Response) => {
        try {
          const result = await this.getTopPaidAddresses();
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
    private async getTopPaidAddresses() {
      const result:any = [];
      const resultSnapshot =
        await FirestoreUtil.getDocumentsInCollection("addresses-async", "amount", "desc", 10);
      resultSnapshot.forEach((doc) => {
        result.push({ address: doc.id, totalReward: doc.data().amount});
      });
      return result;
    }
}
