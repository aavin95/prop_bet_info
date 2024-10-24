require('dotenv').config({ path: '../.env' });
const { createClient } = require('@supabase/supabase-js');

const express = require('express');
const app = express();
const PORT = process.env.PORT || 4000;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// API endpoint to get player data
app.get('/player/:name', async (req, res) => {
    const playerName = req.params.name;

    try {
        // Step 1: Check if the player's game data exists in the database
        let { data: gameData, error } = await supabase
            .from('game_stats')
            .select('*')
            .eq('player_name', playerName);

        if (error) {
            throw error;
        }

        // Step 2: If no data found, fetch from external API
        if (!gameData || gameData.length === 0) {
            console.log(`No data found for ${playerName}, fetching from external API...`);
            const externalData = await fetchPlayerDataFromExternalAPI(playerName);

            // Step 3: Insert the fetched data into the database
            const { error: insertError } = await supabase
                .from('game_stats')
                .insert(externalData);

            if (insertError) {
                throw insertError;
            }

            // Update gameData to return the newly fetched data
            gameData = externalData;
        } else {
            console.log(`Data found for ${playerName}, returning from database...`);
        }

        // Step 4: Return the game data to the user
        res.status(200).json(gameData);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/', async (req, res) => {
    const { data, error } = await supabase
        .from('your_table')
        .select('*');
    if (error) {
        res.status(500).send(error);
    } else {
        res.status(200).send(data);
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
