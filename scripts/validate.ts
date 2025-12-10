import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { z } from "zod";

const platformEnum = z.enum(["fabric", "forge", "neoforge", "extension", "ts", "other", "python"]);
const loaderEnum = z.enum(["fabric", "forge", "neoforge"]);
const releaseTypeEnum = z.enum(["release", "beta", "nightly"]);
const statusEnum = z.enum(["supported", "deprecated", "experimental"]);

const downloadSchema = z.object({
  name: z.string().min(1),
  platform: z.union([platformEnum, z.array(platformEnum).min(1)]),
  url: z.string().url(),
  checksum: z.string().min(1).optional(),
  notes: z.string().min(1).optional(),
});

const buildSchema = z.object({
  id: z.string().min(1),
  repo: z.string().min(1),
  fork: z.string().min(1),
  commit: z.string().min(7),
  jsMacrosVersion: z.string().min(1),
  modLoader: z.array(loaderEnum).min(1),
  extensions: z.array(z.string().min(1)).min(1),
  downloads: z.array(downloadSchema).min(1),
  releaseType: releaseTypeEnum,
  status: statusEnum.optional(),
  publishedAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD")
    .optional(),
  notes: z.string().min(1).optional(),
});

const dataSchema = z.object({
  updatedAt: z.string().min(1),
  versions: z.record(z.string(), z.array(buildSchema)),
});

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: validate.ts <path-to-builds.json>");
    process.exitCode = 1;
    return;
  }

  const raw = await readFile(file, "utf8");
  const parsed = JSON.parse(raw);

  const result = dataSchema.safeParse(parsed);
  if (!result.success) {
    console.error(`Validation failed for ${basename(file)}:`);
    result.error.errors.forEach((err) => {
      const path = err.path.join(".") || "<root>";
      console.error(`- ${path}: ${err.message}`);
    });
    process.exitCode = 1;
    return;
  }

  // Validate no duplicate ids
  const ids = new Set<string>();
  for (const [mcVersion, builds] of Object.entries(result.data.versions || {})) {
    for (const build of builds) {
      if (ids.has(build.id)) {
        console.error(`Validation failed for ${basename(file)}: Duplicate build id "${build.id}" for Minecraft version ${mcVersion}`);
        process.exitCode = 1;
        return;
      }
      ids.add(build.id);
    }
  }

  console.log(`${basename(file)} is valid.`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
