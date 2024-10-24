import pandas as pd
import requests
import os
from dotenv import load_dotenv
import re

# Load environment variables
load_dotenv()

# Load the CSV data (replace with the correct path if necessary)
CSV_FILE_PATH = '2024_Data.csv'  # Renamed to UPPER_CASE
data = pd.read_csv(CSV_FILE_PATH, skiprows=2)  # Updated variable name
# Supabase configuration
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_API_KEY = os.getenv('SUPABASE_KEY')

# Define the Supabase table endpoints
game_stat_endpoint = f"{SUPABASE_URL}/rest/v1/game_stat"
player_endpoint = f"{SUPABASE_URL}/rest/v1/player"
game_endpoint = f"{SUPABASE_URL}/rest/v1/game"
headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_API_KEY,
    'Authorization': f'Bearer {SUPABASE_API_KEY}',
    'Prefer': 'return=representation'
}

# Team name translation
def translate_team_name(team_name):
    """Translates the team abbreviation to its corresponding Supabase team name."""
    team_translation = {
        "BUF": "buffalo-bills",
        "KC": "kansas-city-chiefs",
        "LV": "las-vegas-raiders",
        "PHI": "philadelphia-eagles",
        "CHI": "chicago-bears",
        "ARI": "arizona-cardinals",
        "ATL": "atlanta-falcons",
        "BAL": "baltimore-ravens",
        "CAR": "carolina-panthers",
        "CIN": "cincinnati-bengals",
        "CLE": "cleveland-browns",
        "DAL": "dallas-cowboys",
        "DEN": "denver-broncos",
        "DET": "detroit-lions",
        "GB": "green-bay-packers",
        "HOU": "houston-texans",
        "IND": "indianapolis-colts",
        "JAC": "jacksonville-jaguars",
        "LAC": "los-angeles-chargers",
        "LAR": "los-angeles-rams",
        "MIA": "miami-dolphins",
        "MIN": "minnesota-vikings",
        "NE": "new-england-patriots",
        "NO": "new-orleans-saints",
        "NYG": "new-york-giants",
        "NYJ": "new-york-jets",
        "PIT": "pittsburgh-steelers",
        "SEA": "seattle-seahawks",
        "SF": "san-francisco-49ers",
        "TB": "tampa-bay-buccaneers",
        "TEN": "tennessee-titans",
        "WAS": "washington-commanders"
    }
    return team_translation.get(team_name, team_name.lower())

# Data extraction and transformation
def get_game_stat_data(data_row):  # Renamed parameter to avoid conflict
    """Extracts and transforms game statistics from a data row."""
    # Fetch player_id based on player name
    player_name = data_row["Player"]
    player_response = requests.get(f"{player_endpoint}?name=ilike.{player_name}%25",
                                    headers=headers, timeout=10)  # Added timeout argument
    if player_response.status_code != 200 or len(player_response.json()) == 0:
        add_player_payload = {
            "name": data_row["Player"],
            "team": translate_team_name(data_row["Team"]),
            "position": data_row.get("POS", "Unknown")
        }
        add_player_response = requests.post(player_endpoint, json=add_player_payload,
                                            headers=headers, timeout=10)  # Added timeout argument
        if add_player_response.status_code != 201:
            print(f"Failed to add player {data_row['Player']}. Status code: {add_player_response.status_code}")
            print(f"Error details: {add_player_response.text}")
            return None
        try:
            added_player = add_player_response.json()[0]  # Supabase returns a list
            player_id = added_player['id']
        except (ValueError, KeyError, IndexError) as e:
            print(f"Error parsing add_player_response for {player_name}: {e}")
            print(f"Response content: {add_player_response.text}")
            return None
    else:
        player_id = player_response.json()[0]['id']

    # Translate team name from CSV to match Supabase convention
    team_name = translate_team_name(data_row['Team'])

    # Fetch game_id based on game details (e.g., season, week, home_team, away_team)
    game_response = requests.get(
        f"{game_endpoint}?season=eq.{data_row['SZN']}&week=eq.{data_row['Week']}&or=(home_team.eq.{team_name},away_team.eq.{team_name})",
        headers=headers,
        timeout=10  # Added timeout argument
    )
    if game_response.status_code != 200 or len(game_response.json()) == 0:
        print(f"Game for season {data_row['SZN']}, week {data_row['Week']}, team {team_name} not found. Skipping row.")
        return None
    game_id = game_response.json()[0]['id']

    row_comp_value = data_row["Comp%"].strip('%')
    row_rec_value = data_row["REC%"].strip('%')
    row_comp_percentage = float(row_comp_value) if row_comp_value != 'na' else 0
    row_rec_percentage = float(row_rec_value) if row_rec_value != 'na' else 0
    # Extract relevant fields from the CSV that match the schema of the Supabase table
    return {
        "player_id": player_id,
        "game_id": game_id,
        "passing_yards": int(data_row.get("Pass.1", 0)),
        "rushing_yards": int(data_row.get("Rush.1", 0)),
        "receiving_yards": int(data_row.get("Rec", 0)),
        "passing_touchdowns": int(data_row.get("Pass.2", 0)),
        "rushing_touchdowns": int(data_row.get("Rush.2", 0)),
        "receiving_touchdowns": int(data_row.get("Rec.1", 0)),
        "rush_attempts": int(data_row.get("Rush", 0)),
        "targets": int(data_row.get("TGT", 0)),
        "passing_attempts": int(data_row.get("Pass", 0)),
        "receiving_percentage": row_rec_percentage,
        "completion_percentage": row_comp_percentage
    }

print(isinstance(50.0, float))
# Iterate over rows and insert the data into Supabase
for index, row in data.iterrows():
    game_stat_data = get_game_stat_data(row)
    if game_stat_data is None:
        continue
    response = requests.post(game_stat_endpoint, json=game_stat_data, headers=headers, timeout=10)  # Added timeout argument

    if response.status_code != 201:
        print(f"Row {index}: Failed to insert data. Status code: {response.status_code}, Error: {response.text}")

print("Data insertion complete.")
