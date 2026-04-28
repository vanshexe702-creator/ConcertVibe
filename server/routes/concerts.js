/** Concert Routes — /api/concerts */
const express = require('express');
const router = express.Router();
const { listConcerts, getConcert, getCities, getCategories } = require('../controllers/concertController');

router.get('/cities', getCities);
router.get('/categories', getCategories);
router.get('/:id', getConcert);
router.get('/', listConcerts);

module.exports = router;
