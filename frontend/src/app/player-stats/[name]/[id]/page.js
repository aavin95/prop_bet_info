"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../../lib/supabaseClient";
import PlayerPropChart from "../../../../components/PlayerPropChart";

const POSITION_STATS = {
    QB: [
        { name: "Passing Yards", key: "passing_yards" },
        { name: "Passing TDs", key: "passing_touchdowns" },
        { name: "Passing Attempts", key: "passing_attempts" },
        { name: "Completion %", key: "completion_percentage" },
        { name: "Interceptions", key: "interceptions" }
    ],
    RB: [
        { name: "Rushing Yards", key: "rushing_yards" },
        { name: "Rushing TDs", key: "rushing_tds" },
        { name: "Rushing Attempts", key: "rushing_attempts" },
        { name: "Yards Per Carry", key: "yards_per_carry" },
        { name: "Receptions", key: "receptions" }
    ],
    WR: [
        { name: "Receiving Yards", key: "receiving_yards" },
        { name: "Receiving TDs", key: "receiving_tds" },
        { name: "Receptions", key: "receptions" },
        { name: "Targets", key: "targets" },
        { name: "Yards After Catch", key: "yac" }
    ],
    TE: [
        { name: "Receiving Yards", key: "receiving_yards" },
        { name: "Receiving TDs", key: "receiving_tds" },
        { name: "Receptions", key: "receptions" },
        { name: "Targets", key: "targets" },
        { name: "Blocking Stats", key: "blocking_stats" }
    ]
};

const PlayerStats = () => {
    const { name, id } = useParams();
    const [player, setPlayer] = useState(null);
    const [gameStats, setGameStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedStat, setSelectedStat] = useState(null);

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
                // Set default selected stat based on position
                if (playerData.position && POSITION_STATS[playerData.position]) {
                    setSelectedStat(POSITION_STATS[playerData.position][0].key);
                }

                const { data: gameStatsData, error: gameStatsError } = await supabase
                    .from("game_stat")
                    .select("*")
                    .eq("player_id", id);

                if (gameStatsError) {
                    console.error("Supabase error:", gameStatsError);
                    throw gameStatsError;
                }

                setGameStats(gameStatsData);
                console.log(gameStatsData);
            } catch (err) {
                console.error("Fetch player error:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchPlayer();
    }, [id]);

    const renderStatContent = (statKey) => {
        // Filter relevant stats from gameStats
        const statData = gameStats.map(game => ({
            value: game[statKey],
            date: new Date(game.date).toLocaleDateString()
        })).filter(stat => stat.value != null);

        return (
            <div className="mt-4 p-4 bg-white rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4">
                    {POSITION_STATS[player.position]?.find(stat => stat.key === statKey)?.name}
                </h3>
                {/* Add your graph/visualization component here */}
                <div className="h-64 bg-gray-50 rounded border">
                    {/* Replace this with actual graph component */}
                    <pre className="p-4">
                        {JSON.stringify(statData, null, 2)}
                    </pre>
                </div>
            </div>
        );
    };

    if (loading) return <p className="text-center p-4">Loading...</p>;
    if (error) return <p className="text-center p-4 text-red-500">Error: {error}</p>;

    return (
        <div className="w-full max-w-5xl mx-auto p-6">
            {player ? (
                <div className="space-y-6">
                    {/* Player Profile Section */}
                    <div className="bg-white rounded-lg shadow-md p-8">
                        <div className="flex items-center space-x-6">
                            <img
                                src={player.teamLogoUrl}
                                alt={`${player.team} logo`}
                                className="w-24 h-24 rounded-full shadow-md"
                            />
                            <div className="flex-grow">
                                <h1 className="text-3xl font-bold text-black">{player.name}</h1>
                                <p className="text-lg text-black">
                                    {player.position} • {player.team}
                                </p>
                                <span className={`px-3 py-1 mt-2 inline-block text-sm rounded-full ${player.status === "Active"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                    }`}>
                                    {player.status}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Stats Navigation */}
                    {player.position && POSITION_STATS[player.position] && (
                        <div className="bg-white rounded-lg shadow-md p-4">
                            <div className="flex flex-wrap gap-2">
                                {POSITION_STATS[player.position].map((stat) => (
                                    <button
                                        key={stat.key}
                                        onClick={() => setSelectedStat(stat.key)}
                                        className={`px-4 py-2 rounded-full transition ${selectedStat === stat.key
                                            ? "bg-blue-500 text-white"
                                            : "bg-gray-100 text-black hover:bg-gray-200"
                                            }`}
                                    >
                                        {stat.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <p className="text-center text-black">Player not found.</p>
            )}
            <PlayerPropChart gameStats={gameStats} statKey={selectedStat} statName={POSITION_STATS[player.position]?.find(stat => stat.key === selectedStat)?.name} />
        </div>
    );
};

export default PlayerStats;
