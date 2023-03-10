const express = require('express');
const bodyParser = require('body-parser');
const pg = require('pg');
const app = express();
const exphbs  = require('express-handlebars');



// Configure PostgreSQL connection
const pool = new pg.Pool({
    user: 'zwuproll',
    host: 'zwuproll',
    database: 'seneca DB',
    password: 'I-TP-rA7fbP-iSQhP2EzrOxwwCwki4SO',
    port: 5432
});

// Prepare the database
pool.query(
    `CREATE TABLE IF NOT EXISTS users (
           id SERIAL             PRIMARY KEY,
           name VARCHAR(255)     NOT NULL,
           email VARCHAR(255)    NOT NULL UNIQUE,
           created_at TIMESTAMP  DEFAULT CURRENT_TIMESTAMP
        );`
    );

// Load styles from public folder
app.use(express.static("./public/"));

// Define a custom Handlebars helper function to format dates
const hbs = exphbs.create({
    helpers: {
        formatDate: function (date) {
            return date.toLocaleDateString();
        }
    },
    extname:".hbs"
});

// Register handlebars as the rendering engine for views
app.engine(".hbs", hbs.engine);
app.set("view engine", ".hbs");


// Use body-parser middleware to parse incoming form data
app.use(bodyParser.urlencoded({ extended: false }));

// Serve the HTML form
app.get('/update-user', (req, res) => {

    const id = req.query.id;
    pool.query(`SELECT * FROM users WHERE id = ${id}`, (error, results) => {
        // Handle any errors that occur
        if (error) {
            console.error(error);
            res.status(500).send('Internal server error');
            return;
        }
        // Render the 'index' template with the list of users as a context object
        res.render('edit', { users: results.rows[0], layout:false });
    });
    
});

// Update user data in database
    app.post('/update-user', async (req, res) => {
        const id = req.query.id;
        const name = req.body.name;
        const email = req.body.email;
      
        try {
          const client = await pool.connect();
          await client.query('BEGIN');
          const result = await client.query('UPDATE users SET name = $1, email = $2 WHERE id = $3', [name, email, id]);
          const rowCount = result.rowCount;
          await client.query('COMMIT');
      
          if (rowCount == 0) {
            res.status(404).json({ message: 'User not found.' });
          } else {
            res.redirect('/');
          }
        } catch (err) {
          console.error(err);
          await client.query('ROLLBACK');
          res.status(500).json({ message: 'Error updating data into PostgreSQL.' });
        } finally {
          client.release();
        }
      });

// Delete user data in database
    app.get('/delete-user', async (req, res) => {
        const id = req.query.id;
      
        try {
          const client = await pool.connect();
          await client.query('BEGIN');
          const result = await client.query('DELETE FROM users WHERE id = $1', [id]);
          const rowCount = result.rowCount;
          await client.query('COMMIT');
      
          if (rowCount == 0) {
            res.status(404).json({ message: 'User not found.' });
          } else {
            res.redirect('/');
          }
        } catch (err) {
          console.error(err);
          await client.query('ROLLBACK');
          res.status(500).json({ message: 'Error deleting data from PostgreSQL.' });
        } finally {
          client.release();
        }
      });
      

// Handle form submission
app.post('/insert-user', (req, res) => {
    const { name, email } = req.body;
    // Insert data into PostgreSQL
    pool.query(
        'INSERT INTO users (name, email) VALUES ($1, $2)',
        [name, email],
        (error, results) => {
            if (error) {
                console.log(error); res.status(500).json({ message: 'Error inserting data into PostgreSQL' });
            } else {
                res.redirect("/");
            }
        });
});


app.get('/', (req, res) => {
    pool.query('SELECT * FROM users ORDER BY id ASC', (error, results) => {
        // Handle any errors that occur
        if (error) {
            console.error(error);
            res.status(500).send('Internal server error');
            return;
        }
        // Render the 'index' template with the list of users as a context object
        res.render('index', { users: results.rows, layout:false });
    });
});


// Start the server
app.listen(5000, () => {
    console.log('Server started on http://localhost:5000');
});