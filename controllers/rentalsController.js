const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const fileUpload = require('express-fileupload');
const models = require("../models/rentals-db.js");
const Rental = require("../models/rentalModel.js");

router.use(fileUpload());

const isClerk = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'clerk') {
      next();
    } else {
      res.status(401).send('Unauthorized: Only clerks can access this resource.');
    }
  };
  
  

router.get('/',  (req, res) => res.render("rentals", { rentals: models.getRentalsByCityAndProvince() }));

router.get('/list', isClerk, (req, res) => {
    Rental.find()
    .sort({ headline: 'asc' })
    .then(rentals => {
        if (!rentals) {
            return res.status(404).send('No rentals found.');
        }
        console.log(rentals);
        res.render('rentals/list', { rentals });
    })
    .catch(error => {
        console.error(error);
        res.status(500).send('Internal Server Error');
    });
});
    
router.get('/add', isClerk, (req, res) => {
    res.render('rentals/add');
  });
  
  router.post('/add', (req, res) => {
  
    const {
      headline,
      numSleeps,
      numBedrooms,
      numBathrooms,
      pricePerNight,
      city,
      province,
      featuredRental,
    } = req.body;
  
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).send('No file uploaded.');
    }
  
    const imageUrl = req.files.imageUrl;
    const uploadPath = path.join(__dirname, '..', 'assets', 'img', imageUrl.name);
  
    imageUrl.mv(uploadPath, async (err) => {
      if (err) {
        return res.status(500).send(err);
      }
  
      const newRental = new Rental({
        headline,
        numSleeps,
        numBedrooms,
        numBathrooms,
        pricePerNight,
        city,
        province,
        imageUrl: `/img/${imageUrl.name}`,
        featuredRental: featuredRental === 'on',
      });
  
      try {
        await newRental.save();
        res.redirect('/rentals/list');
      } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
      }
    });
  });
  


module.exports = router