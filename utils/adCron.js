import cron from "node-cron";
import Advertise from "../models/Advertise.js";

export const initAdExpiryCron = () => {
  // Runs every hour at minute 0 (0 * * * *)
  cron.schedule("0 * * * *", async () => {
    try {
      const now = new Date();

      // Find and update all approved ads whose endDate has passed
      const result = await Advertise.updateMany(
        {
          status: "Approved",
          endDate: { $lt: now },
        },
        {
          $set: { status: "Expired" },
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`[Ad Cron] Auto-expired ${result.modifiedCount} advertisement(s).`);
      }
    } catch (error) {
      console.error("[Ad Cron Error]:", error);
    }
  });
};
