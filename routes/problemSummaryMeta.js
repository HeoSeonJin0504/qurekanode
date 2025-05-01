const express = require('express');
const router = express.Router();
const problemSummaryMetaController = require('../controllers/problemSummaryMetaController');

router.get('/', problemSummaryMetaController.getAllProblemSummaryMeta);
router.get('/:id', problemSummaryMetaController.getProblemSummaryMetaById);

module.exports = router;
