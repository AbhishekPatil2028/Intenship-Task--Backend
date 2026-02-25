import express from "express";
import {
  createForm,
  getAllForms,
  updateForm,
  deleteForm
} from "../controllers/form.controller.js";

const router = express.Router();

router.post("/", createForm);           // CREATE
router.get("/", getAllForms);            // READ
router.put("/:id", updateForm);          // UPDATE
router.delete("/:id", deleteForm);       // DELETE

export default router;
