const express = require("express");
const WorkRequest = require("../models/WorkRequest");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Get all requests
router.get("/", protect, async (req, res) => {
  const requests = await WorkRequest.find();
  res.json(requests);
});

// Create request
router.post("/", protect, async (req, res) => {
  const request = await WorkRequest.create(req.body);
  res.status(201).json(request);
});

// Update request
router.put("/:id", protect, async (req, res) => {
  const request = await WorkRequest.findById(req.params.id);

  if (!request) return res.status(404).json({ message: "Not found" });

  Object.assign(request, req.body);
  request.lastUpdated = new Date();

  const updated = await request.save();
  res.json(updated);
});

// Delete request (Admin only recommended)
router.delete("/:id", protect, async (req, res) => {
  await WorkRequest.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted successfully" });
});

module.exports = router;
