require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const authJwtController = require('./auth_jwt'); // You're not using authController, consider removing it
const jwt = require('jsonwebtoken');
const cors = require('cors');
const User = require('./Users');
const Movie = require('./Movies'); // Use Movie model

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

const router = express.Router();

// Removed getJSONObjectForMovieRequirement as it's not used

router.post('/signup', async (req, res) => { // Use async/await
  if (!req.body.username || !req.body.password) {
    return res.status(400).json({ success: false, msg: 'Please include both username and password to signup.' }); // 400 Bad Request
  }

  try {
    const user = new User({ // Create user directly with the data
      name: req.body.name,
      username: req.body.username,
      password: req.body.password,
    });

    await user.save(); // Use await with user.save()

    res.status(201).json({ success: true, msg: 'Successfully created new user.' }); // 201 Created
  } catch (err) {
    if (err.code === 11000) { // Strict equality check (===)
      return res.status(409).json({ success: false, message: 'A user with that username already exists.' }); // 409 Conflict
    } else {
      console.error(err); // Log the error for debugging
      return res.status(500).json({ success: false, message: 'Something went wrong. Please try again later.' }); // 500 Internal Server Error
    }
  }
});


router.post('/signin', async (req, res) => { // Use async/await
  try {
    const user = await User.findOne({ username: req.body.username }).select('name username password');

    if (!user) {
      return res.status(401).json({ success: false, msg: 'Authentication failed. User not found.' }); // 401 Unauthorized
    }

    const isMatch = await user.comparePassword(req.body.password); // Use await

    if (isMatch) {
      const userToken = { id: user._id, username: user.username }; // Use user._id (standard Mongoose)
      const token = jwt.sign(userToken, process.env.SECRET_KEY, { expiresIn: '1h' }); // Add expiry to the token (e.g., 1 hour)
      res.json({ success: true, token: 'JWT ' + token });
    } else {
      res.status(401).json({ success: false, msg: 'Authentication failed. Incorrect password.' }); // 401 Unauthorized
    }
  } catch (err) {
    console.error(err); // Log the error
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again later.' }); // 500 Internal Server Error
  }
});

router.route('/movies')
  .get(authJwtController.isAuthenticated, async (req, res) => {
    try {
      const movies = await Movie.find();
      res.status(200).json(movies);
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to retrieve movies', error: err.message });
    }
  })
  .post(authJwtController.isAuthenticated, async (req, res) => {
    const { title, releaseDate, genre, actors } = req.body;

    // Validate required information:
    // Movie needs an actors array with at least 1 actor conceptually, though schema doesn't strictly enforce length > 0
    // We will enforce it here as per instructions: "If a movie does not contain actors ... the entity should not be created"
    if (!title || !releaseDate || !genre || !actors || actors.length === 0) {
      return res.status(400).json({ success: false, message: 'Movie must include title, releaseDate, genre, and at least one actor.' });
    }

    try {
      const movie = new Movie({
        title,
        releaseDate,
        genre,
        actors
      });
      await movie.save();
      res.status(201).json({ success: true, message: 'Movie successfully created.', movie });
    } catch (err) {
      res.status(400).json({ success: false, message: 'Error saving movie.', error: err.message });
    }
  })
  .put(authJwtController.isAuthenticated, async (req, res) => {
    return res.status(405).json({ success: false, message: 'PUT requests are not supported on /movies. Please use /movies/:movieparameter' });
  })
  .delete(authJwtController.isAuthenticated, async (req, res) => {
    return res.status(405).json({ success: false, message: 'DELETE requests are not supported on /movies. Please use /movies/:movieparameter' });
  });

router.route('/movies/:movieparameter')
  .get(authJwtController.isAuthenticated, async (req, res) => {
    try {
      const movie = await Movie.findOne({ title: req.params.movieparameter });
      if (!movie) {
        return res.status(404).json({ success: false, message: 'Movie not found.' });
      }
      res.status(200).json(movie);
    } catch (err) {
      res.status(500).json({ success: false, message: 'Error retrieving movie.', error: err.message });
    }
  })
  .post(authJwtController.isAuthenticated, async (req, res) => {
    return res.status(405).json({ success: false, message: 'POST request not supported on /movies/:movieparameter. Please use /movies' });
  })
  .put(authJwtController.isAuthenticated, async (req, res) => {
    try {
      const updatedMovie = await Movie.findOneAndUpdate(
        { title: req.params.movieparameter },
        req.body,
        { new: true, runValidators: true } // Return updated doc, run schema validators
      );

      if (!updatedMovie) {
        return res.status(404).json({ success: false, message: 'Movie not found to update.' });
      }
      res.status(200).json({ success: true, message: 'Movie successfully updated.', movie: updatedMovie });
    } catch (err) {
      res.status(400).json({ success: false, message: 'Error updating movie.', error: err.message });
    }
  })
  .delete(authJwtController.isAuthenticated, async (req, res) => {
    try {
      const deletedMovie = await Movie.findOneAndDelete({ title: req.params.movieparameter });
      if (!deletedMovie) {
        return res.status(404).json({ success: false, message: 'Movie not found to delete.' });
      }
      res.status(200).json({ success: true, message: 'Movie successfully deleted.' });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Error deleting movie.', error: err.message });
    }
  });

app.use('/', router);

const PORT = process.env.PORT || 8080; // Define PORT before using it
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app; // for testing only