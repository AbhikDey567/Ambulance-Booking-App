const Record = require('../Models/Record'); // path to the Record model you created
const User = require('../Models/User'); // optional, used only for population reference
const Driver = require('../Models/Driver'); // optional, used only for population reference

// Create Record
const createRecord = async (req, res) => {
  try {
    const { driverId, userLocation, hospitalLocation, ambulanceType, arrivalTime } = req.body;
    const userId = req.user && req.user._id;

    // Basic validation
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized", success: false });
    }
    if (!driverId) {
      return res.status(400).json({ message: "driverId is required", success: false });
    }
    if (!userLocation || !userLocation.address) {
      return res.status(400).json({ message: "userLocation.address is required", success: false });
    }
    if (!ambulanceType) {
      return res.status(400).json({ message: "ambulanceType is required", success: false });
    }

    const record = new Record({
      userId,
      driverId,
      userLocation,
      hospitalLocation: hospitalLocation || null,
      ambulanceType,
      arrivalTime: arrivalTime || null,
      status: 'pending'
    });

    await record.save();

    const populatedRecord = await Record.findById(record._id)
      .populate("userId", "name phone")
      .populate("driverId", "name phone typeOfAmbulance");

    res.status(201).json({ message: 'Record created', record: populatedRecord, success: true });
  } catch (err) {
    console.error("createRecord error:", err);
    res.status(500).json({ message: "Server error", error: err.message, success: false });
  }
};

// Get records for logged-in driver (records where driverId === req.user._id)
const getMyRecords = async (req, res) => {
  try {
    const driverId = req.user && req.user._id;
    if (!driverId) {
      return res.status(401).json({ message: "Unauthorized", success: false });
    }

    const records = await Record.find({ driverId })
      .populate("userId", "name phone")
      .populate("driverId", "name phone");

    res.json({ success: true, records });
  } catch (err) {
    console.error("getMyRecords error:", err);
    res.status(500).json({ message: "Server error", error: err.message, success: false });
  }
};

// Get records by driver ID (from route param)
const getRecordsByDriver = async (req, res) => {
  try {
    const { id } = req.params;

    const records = await Record.find({ driverId: id })
      .populate("userId", "name phone")
      .populate("driverId", "name phone");

    res.json({ success: true, records });
  } catch (err) {
    console.error("getRecordsByDriver error:", err);
    res.status(500).json({ message: "Server error", error: err.message, success: false });
  }
};

// Get records by user ID (from route param)
const getRecordsByUser = async (req, res) => {
  try {
    const { id } = req.params;

    const records = await Record.find({ userId: id })
      .populate("userId", "name phone")
      .populate("driverId", "name phone");

    res.json({ success: true, records });
  } catch (err) {
    console.error("getRecordsByUser error:", err);
    res.status(500).json({ message: "Server error", error: err.message, success: false });
  }
};

// Update / confirm record (set status to 'confirmed' and optional arrivalTime)
const confirmRecord = async (req, res) => {
  try {
    const { arrivalTime } = req.body;

    const updatedRecord = await Record.findByIdAndUpdate(
      req.params.id,
      { status: 'confirmed', ...(arrivalTime ? { arrivalTime } : {}) },
      { new: true }
    )
      .populate("userId", "name phone")
      .populate("driverId", "name phone");

    if (!updatedRecord) {
      return res.status(404).json({ message: "Record not found", success: false });
    }

    res.json({ message: "Record confirmed", record: updatedRecord, success: true });
  } catch (err) {
    console.error("confirmRecord error:", err);
    res.status(500).json({ message: "Server error", error: err.message, success: false });
  }
};

// Cancel record (set status to 'cancelled')
const cancelRecord = async (req, res) => {
  try {
    const updatedRecord = await Record.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    )
      .populate("userId", "name phone")
      .populate("driverId", "name phone");

    if (!updatedRecord) {
      return res.status(404).json({ message: "Record not found", success: false });
    }

    res.json({ message: "Record cancelled", record: updatedRecord, success: true });
  } catch (err) {
    console.error("cancelRecord error:", err);
    res.status(500).json({ message: "Server error", error: err.message, success: false });
  }
};

// Delete record (only if pending or cancelled)
const deleteRecord = async (req, res) => {
  try {
    const record = await Record.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ message: "Record not found", success: false });
    }

    // Only allow delete if status is pending or cancelled
    if (record.status !== "pending" && record.status !== "cancelled") {
      return res.status(400).json({ message: "Only pending or cancelled records can be deleted", success: false });
    }

    await record.deleteOne();

    res.json({ message: "Record deleted successfully", recordId: req.params.id, success: true });
  } catch (err) {
    console.error("deleteRecord error:", err);
    res.status(500).json({ message: "Server error", error: err.message, success: false });
  }
};

module.exports = {
  createRecord,
  getMyRecords,
  getRecordsByDriver,
  getRecordsByUser,
  confirmRecord,
  cancelRecord,
  deleteRecord,
};
