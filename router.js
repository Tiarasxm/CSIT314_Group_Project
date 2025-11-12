import { Router } from "express";
const router = Router();

router.get("/", (_req, res) => res.json({ api: "ok" }));

export default router;
