// This file creates and exports the one shared Redis client
import { Redis } from "ioredis";

const redis = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

export default redis;
