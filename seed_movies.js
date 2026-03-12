require('dotenv').config();
const mongoose = require('mongoose');
const Movie = require('./Movies'); // Use Movie model

const seedMovies = async () => {
    try {
        await mongoose.connect(process.env.DB);
        console.log('Connected to DB');

        // Clear existing movies to avoid duplicates if run multiple times
        await Movie.deleteMany({});

        const count = await Movie.countDocuments();
        if (count === 0) {
            await Movie.insertMany([
                {
                    title: "Inception",
                    releaseDate: 2010,
                    genre: "Science Fiction",
                    actors: [{ actorName: "Leonardo DiCaprio", characterName: "Cobb" }, { actorName: "Joseph Gordon-Levitt", characterName: "Arthur" }]
                },
                {
                    title: "The Dark Knight",
                    releaseDate: 2008,
                    genre: "Action",
                    actors: [{ actorName: "Christian Bale", characterName: "Batman" }, { actorName: "Heath Ledger", characterName: "Joker" }]
                },
                {
                    title: "Interstellar",
                    releaseDate: 2014,
                    genre: "Science Fiction",
                    actors: [{ actorName: "Matthew McConaughey", characterName: "Cooper" }, { actorName: "Anne Hathaway", characterName: "Brand" }]
                },
                {
                    title: "Pulp Fiction",
                    releaseDate: 1994,
                    genre: "Drama",
                    actors: [{ actorName: "John Travolta", characterName: "Vincent Vega" }, { actorName: "Samuel L. Jackson", characterName: "Jules Winnfield" }]
                },
                {
                    title: "The Matrix",
                    releaseDate: 1999,
                    genre: "Science Fiction",
                    actors: [{ actorName: "Keanu Reeves", characterName: "Neo" }, { actorName: "Laurence Fishburne", characterName: "Morpheus" }]
                }
            ]);
            console.log("Successfully seeded 5 movies!");
        } else {
            console.log("Movies already present.");
        }
    } catch (error) {
        console.error("Error seeding movies", error);
    } finally {
        mongoose.connection.close();
    }
};

seedMovies();
