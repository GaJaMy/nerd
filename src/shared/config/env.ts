import { z } from 'zod'

const clientEnvSchema = z.object({
  DEV: z.boolean(),
  MODE: z.string(),
  PROD: z.boolean(),
  VITE_API_BASE_URL: z.url().default('http://localhost:8080'),
  VITE_APP_NAME: z.string().default('Nerd Frontend'),
})

export const env = clientEnvSchema.parse(import.meta.env)
