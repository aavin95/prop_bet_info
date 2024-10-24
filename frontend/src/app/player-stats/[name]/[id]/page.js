"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../../lib/supabaseClient";

const PlayerStats = () => {
    const { name, id } = useParams();
    const [player, setPlayer] = useState(null);
    const [gameStats, setGameStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPlayer = async () => {
            if (!id) return;

            try {
                const { data: playerData, error: playerError } = await supabase
                    .from("player")
                    .select("*")
                    .eq("id", id)
                    .single();

                if (playerError) {
                    console.error("Supabase error:", playerError);
                    throw playerError;
                }

                setPlayer(playerData);

                const { data: gameStatsData, error: gameStatsError } = await supabase
                    .from("game_stat")
                    .select("*")
                    .eq("player_id", id);

                if (gameStatsError) {
                    console.error("Supabase error:", gameStatsError);
                    throw gameStatsError;
                }

                setGameStats(gameStatsData);
            } catch (err) {
                console.error("Fetch player error:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchPlayer();
    }, [id]);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <div className="w-full max-w-5xl mx-auto p-6">
            {player ? (
                <div className="bg-white rounded-lg shadow-md p-8">
                    {/* Player Profile Section */}
                    <div className="flex items-center space-x-6">
                        <img
                            src={player.teamLogoUrl}
                            alt={`${player.team} logo`}
                            className="w-24 h-24 rounded-full shadow-md"
                        />
                        <div className="flex-grow">
                            <h1 className="text-3xl font-bold text-gray-800">{player.name}</h1>
                            <p className="text-lg text-gray-600">{player.position} • {player.team}</p>
                            <span className={`px-3 py-1 mt-2 inline-block text-sm rounded-full ${player.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {player.status}
                            </span>
                        </div>
                    </div>

                    {/* Game Stats Overview */}
                    <div className="mt-8 grid grid-cols-3 gap-4">
                        {gameStats.map((stat, index) => (
                            <div key={index} className="bg-gray-100 p-4 rounded-lg text-center">
                                <p className="text-lg font-semibold text-gray-800">Week {stat.week}</p>
                                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                                <p className="text-sm text-gray-500">{stat.odds}</p>
                            </div>
                        ))}
                    </div>

                    {/* Prop Analysis Section */}
                    <div className="mt-10">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">{player.name} Pass YDs Prop</h2>
                        <div className="flex flex-wrap items-center space-x-6 mb-6">
                            <div className="flex flex-col items-center">
                                <p className="text-gray-600">Consensus Line</p>
                                <p className="text-xl font-bold text-gray-800">{player.consensusLine}</p>
                            </div>
                            <div className="flex flex-col items-center">
                                <p className="text-gray-600">Projection</p>
                                <p className="text-xl font-bold text-gray-800">{player.projection}</p>
                            </div>
                            <div className="flex flex-col items-center">
                                <p className="text-gray-600">Cover Probability</p>
                                <p className="text-lg text-gray-800">—</p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <p className="text-gray-600 text-center">Player not found.</p>
            )}
        </div>
    );
};

export default PlayerStats;
