// components/SearchBar.jsx
"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { redirect } from "next/navigation";

const SearchBar = () => {
  const [query, setQuery] = useState("");
  const [players, setPlayers] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("player")
          .select("name")
          .ilike("name", `%${query}%`)
          .limit(5);

        if (error) {
          console.error("Supabase error:", error);
          throw error;
        }

        setSuggestions(data || []);
      } catch (err) {
        console.error("Suggestion error:", err);
        setError(err.message);
      }
    };

    fetchSuggestions();
  }, [query]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (suggestions.length > 0) {
        const topSuggestion = suggestions[0].name;
        const { data, error } = await supabase
          .from("player")
          .select("*")
          .eq("name", topSuggestion);

        if (error) {
          console.error("Supabase error:", error);
          throw error;
        }

        window.location.href = `/player-stats/${topSuggestion}/${data[0].id}`;
      } else {
        setPlayers([]);
      }
    } catch (err) {
      console.error("Search error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = async (name) => {
    setQuery(name);
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("player")
        .select("*")
        .eq("name", name);

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      window.location.href = `/player-stats/${name}/${data[0].id}`;
    } catch (err) {
      console.error("Search error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white p-6 rounded-md shadow-md">
      <form onSubmit={handleSearch} className="flex">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a player..."
          className="w-full px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
          required
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-grey-100 rounded-r-md hover:bg-blue-600 transition"
        >
          Search
        </button>
      </form>

      {suggestions.length > 0 && (
        <ul className="mt-2 bg-white border border-gray-300 rounded-md shadow-md">
          {suggestions.map((suggestion) => (
            <li
              key={suggestion.name}
              onClick={() => handleSuggestionClick(suggestion.name)}
              className="p-2 cursor-pointer hover:bg-black-100 text-black"
            >
              {suggestion.name}
            </li>
          ))}
        </ul>
      )}

      {loading && <p className="mt-4 text-center text-black">Loading...</p>}
      {error && <p className="mt-4 text-center text-black">{error}</p>}

      {players.length > 0 && (
        <ul className="mt-4 space-y-2">
          {players.map((player) => (
            <li
              key={player.id}
              className="p-4 border border-gray-200 rounded-md shadow-sm hover:shadow-md transition text-black"
            >
              <h2 className="text-lg font-semibold text-black">
                {player.name}
              </h2>
              <p className="text-black">Team: {player.team}</p>
            </li>
          ))}
        </ul>
      )}

      {players.length === 0 && !loading && !error && query && (
        <p className="mt-4 text-center text-black">No players found.</p>
      )}
    </div>
  );
};

export default SearchBar;
