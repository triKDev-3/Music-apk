export default async function handler(req: any, res: any) {
  try {
    const module = await import('../server');
    const app = module.default || module.app || module;
    return app(req, res);
  } catch (e: any) {
    console.error("SERVER IMPORT ERROR:", e);
    return res.status(500).send(e.stack || e.message);
  }
}
