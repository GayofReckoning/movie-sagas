const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const port = process.env.PORT || 5000;
const pool = require('./modules/pool');

/** ---------- MIDDLEWARE ---------- **/
app.use(bodyParser.json()); // needed for angular requests
app.use(express.static('build'));

/** ---------- ROUTES ---------- **/
app.get('/movie', (req, res) => {
    // return all movies with an aggregate array of genres
    const queryText = 
    `Select"title", "description", "poster", "movies"."id", array_agg(name) "genres" 
    FROM "movies"
    JOIN "movie_genre" on "movies"."id" = "movie_genre"."movie_id"
    JOIN "genres" on "movie_genre"."genre_id" = "genres"."id"
    GROUP BY "movies"."id"
    ORDER BY "movies"."id" ASC;`;
    pool.query(queryText)
        .then( (result) => {
            res.send(result.rows);
        })
        .catch( (error) => {
            console.log(`Error on query ${error}`);
            res.sendStatus(500);
        });//end query
});//end movie.get

//This is called a genre route but it returns all the details for a specific movie
app.get('/genre:id', (req,res)=>{
    //return all details (including genre agg) for a movie, based on movie id
    console.log('in genre GET', req.params.id)
    const queryString = 
        `Select"title", "description", "poster", "movies"."id", array_agg(name) "genres" FROM "movies"
        JOIN "movie_genre" on "movies"."id" = "movie_genre"."movie_id"
        JOIN "genres" on "movie_genre"."genre_id" = "genres"."id"
        WHERE "movies"."id" = $1
        GROUP BY "movies"."id";`
    pool.query(queryString, [req.params.id])
    .then( (result) => {
        res.send(result.rows);
    })
    .catch( (error) => {
        console.log(`Error on genre get: ${error}`);
        res.sendStatus(500);
    });//end query  
})//end genre:id.get
// ^ this is poorly named, sorry

app.put('/movie:id', (req,res)=>{
    //updates a movie title and/or description based on the movie id
    console.log('in movie PUT', req.params.id, req.body.payload.title);
    const queryString = 
        `UPDATE "movies"
        SET "title" = $1,
        "description" = $2
        WHERE id = $3;`
    pool.query( queryString, [ req.body.payload.title,
         req.body.payload.description, 
         req.params.id ] )
    .then( (result) => {
        res.sendStatus(201);
    })
    .catch( (error) => {
        console.log(`Error on genre get: ${error}`);
        res.sendStatus(500);
    });//end query  
})//end /movie:id PUT

/** ---------- START SERVER ---------- **/
app.listen(port, function () {
    console.log('Listening on port: ', port);
});