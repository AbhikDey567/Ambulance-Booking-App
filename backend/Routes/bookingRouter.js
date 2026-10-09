const express = require('express');
const router = express.Router();

const recordController = require('../Controllers/RecordController');
const { verifyToken, verifyRole } = require('../Middlewares/AuthValidation');

// --------------------------------------------------
// RECORD ROUTES (Replaces Booking Routes)
// --------------------------------------------------

// CREATE A NEW RECORD (Only users)
router.post(
  '/create',
  verifyToken,
  verifyRole(['user']),
  recordController.createRecord
);

// GET RECORDS FOR LOGGED-IN DRIVER
router.get(
  '/my-records',
  verifyToken,
  verifyRole(['driver']),
  recordController.getMyRecords
);

// UPDATE RECORD STATUS (driver can confirm/complete)
router.put(
  '/confirm/:id',
  verifyToken,
  verifyRole(['driver']),
  recordController.confirmRecord
);

// CANCEL A RECORD (user, driver, or admin)
router.put(
  '/cancel/:id',
  verifyToken,
  verifyRole(['user', 'driver', 'admin']),
  recordController.cancelRecord
);

// GET RECORDS BY DRIVER ID (user/driver/admin)
router.get(
  '/driver/:id',
  verifyToken,
  verifyRole(['user', 'driver', 'admin']),
  recordController.getRecordsByDriver
);

// GET RECORDS BY USER ID (only that user or admin)
router.get(
  '/user/:id',
  verifyToken,
  verifyRole(['user', 'admin']),
  recordController.getRecordsByUser
);

// DELETE A RECORD (only users, only if pending or cancelled)
router.delete(
  '/delete/:id',
  verifyToken,
  verifyRole(['user']),
  recordController.deleteRecord
);

module.exports = router;
