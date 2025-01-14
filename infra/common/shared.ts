export function isDevOrPreview(): boolean {
  const stage = process.env.STAGE;

  if (!stage) {
    throw new Error("STAGE env var not defined!");
  }

  return stage.startsWith("dev-") || stage.startsWith("preview-");
}
