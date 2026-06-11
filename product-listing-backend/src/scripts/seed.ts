import mongoose from "mongoose";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import { User } from "../models/User";

/**
 * Provisions the single application user from SEED_ADMIN_USERNAME /
 * SEED_ADMIN_PASSWORD. Idempotent: running it again updates the existing
 * user's password rather than creating a duplicate. There is no public
 * registration, so this is the only way the user is created.
 */
async function seed(): Promise<void> {
  const { username, password } = env.seed;

  await mongoose.connect(env.mongoUri);
  logger.info("Connected to MongoDB for seeding");

  const existing = await User.findOne({ username }).select("+password");

  if (existing) {
    // Re-assign so the pre-save hook re-hashes the password.
    existing.password = password;
    await existing.save();
    logger.info(`Updated existing seed user "${username}"`);
  } else {
    await User.create({ username, password });
    logger.info(`Created seed user "${username}"`);
  }
}

seed()
  .catch((error) => {
    logger.error({ err: error }, "Seeding failed");
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
