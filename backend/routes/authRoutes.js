import express from "express";
import { login, me, register } from "../controllers/authController.js";
import { auth } from "../middleware.js";
const router=express.Router();
router.post('/register',register);
router.post('/login',login);
router.get('/me',auth,me);
export default router;
