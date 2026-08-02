import { z } from "zod";

export const isoDate = z
  .union([z.date(), z.string(), z.number()])
  .transform((v) => new Date(v))
  .refine((d) => !Number.isNaN(d.getTime()), "Invalid date");
