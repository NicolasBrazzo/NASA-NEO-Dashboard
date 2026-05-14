"use client";

import { useMemo } from "react";

export const AsteroidRadar = ({ asteroids, startDate, endDate }) => {
    // Scala: 1 LD = 4.6 unità SVG (230px / 50 LD)
    const SCALE = 230 / 50; 

    // Estrai distanza in LD dal close_approach_data
    const getDistance = (asteroid) => {
        const approach = asteroid.close_approach_data?.[0];
        if (!approach) return 25; // fallback centro
        
        // NASA restituisce distanza in unità astronomiche o LD
        const ld = approach.miss_distance?.lunar;
        if (ld) return parseFloat(ld);
        
        // Conversione da AU a LD (1 AU ≈ 389 LD)
        const au = approach.miss_distance?.astronomical;
        if (au) return parseFloat(au) * 389;
        
        return 25;
    };

    // Genera angolo deterministico dall'ID per posizionamento coerente
    const getAngle = (asteroid, index) => {
        // Usa gli ultimi 3 caratteri dell'ID per un angolo pseudo-random ma stabile
        const idNum = parseInt(asteroid.neo_reference_id?.slice(-3) || index);
        return (idNum * 137.5) % 360; // Angolo aureo per distribuzione uniforme
    };

    const processedAsteroids = useMemo(() => {
        return asteroids.map((asteroid, index) => ({
            ...asteroid,
            distance: getDistance(asteroid),
            angle: getAngle(asteroid, index)
        })).sort((a, b) => a.distance - b.distance);
    }, [asteroids]);

    const phaCount = processedAsteroids.filter(a => a.is_potentially_hazardous_asteroid).length;

    return (
        <div className="relative w-full aspect-square max-w-125">
            <style>{`
                @keyframes sweep {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes orbit {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>

            <svg viewBox="-250 -250 500 500" className="w-full h-full">
                <defs>
                    {/* Gradiente Terra */}
                    <radialGradient id="earthGrad" cx="30%" cy="30%">
                        <stop offset="0%" stopColor="#4A90D9" />
                        <stop offset="100%" stopColor="#1E3A5F" />
                    </radialGradient>
                    
                    {/* Gradiente Fascia Radar - più ampia e intensa */}
                    <linearGradient id="sweepGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#FF6B35" stopOpacity="0" />
                        <stop offset="30%" stopColor="#FF6B35" stopOpacity="0.1" />
                        <stop offset="70%" stopColor="#FF6B35" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#FF6B35" stopOpacity="0.9" />
                    </linearGradient>

                    {/* Glow per la punta del radar */}
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>

                {/* Sfondo scuro del radar */}
                <circle cx="0" cy="0" r="240" fill="#0a0a0f" opacity={0.5}/>

                {/* Cerchi di distanza */}
                <circle cx="0" cy="0" r="230" stroke="var(--border-strong, #333)" fill="none" strokeWidth="1"/>
                <circle cx="0" cy="0" r="180" opacity={0.4} stroke="var(--border-strong, #333)" fill="none" strokeWidth="1"/>
                <circle cx="0" cy="0" r="110" opacity={0.4} stroke="var(--border-strong, #333)" fill="none" strokeWidth="1"/>
                <circle cx="0" cy="0" r="40" opacity={0.4} stroke="var(--border-strong, #333)" fill="none" strokeWidth="1"/>

                {/* Linee cardinali */}
                <line x1="-230" y1="0" x2="230" y2="0" opacity={0.2} stroke="var(--border-strong, #333)" strokeWidth="1"/>
                <line x1="0" y1="-230" x2="0" y2="230" opacity={0.2} stroke="var(--border-strong, #333)" strokeWidth="1"/>

                {/* Etichette distanza */}
                <text x="0" y="-185" textAnchor="middle" fill="var(--border-strong, #555)" fontSize="8" opacity={0.6} fontFamily="monospace">30 LD</text>
                <text x="0" y="-115" textAnchor="middle" fill="var(--border-strong, #555)" fontSize="8" opacity={0.6} fontFamily="monospace">10 LD</text>
                <text x="0" y="-45" textAnchor="middle" fill="var(--border-strong, #555)" fontSize="8" opacity={0.6} fontFamily="monospace">1 LD</text>

                {/* Punti cardinali */}
                <text x="0" y="-240" textAnchor="middle" fill="#FF6B35" fontSize="11" fontFamily="monospace" fontWeight="bold">N</text>
                <text x="240" y="4" textAnchor="middle" fill="#FF6B35" fontSize="11" fontFamily="monospace" fontWeight="bold">E</text>
                <text x="0" y="248" textAnchor="middle" fill="#FF6B35" fontSize="11" fontFamily="monospace" fontWeight="bold">S</text>
                <text x="-240" y="4" textAnchor="middle" fill="#FF6B35" fontSize="11" fontFamily="monospace" fontWeight="bold">W</text>

                {/* Asteroidi fissi */}
                {processedAsteroids.map((asteroid, index) => {
                    const distance = Math.min(asteroid.distance * SCALE, 225); // Clamp al bordo
                    const angleRad = (asteroid.angle * Math.PI) / 180;
                    const x = distance * Math.cos(angleRad);
                    const y = distance * Math.sin(angleRad);
                    
                    const isPHA = asteroid.is_potentially_hazardous_asteroid;
                    const size = isPHA ? 5 : 3;
                    
                    return (
                        <g key={asteroid.id || index}>
                            {/* Alone per PHA */}
                            {isPHA && (
                                <circle 
                                    cx={x} 
                                    cy={y} 
                                    r={10} 
                                    fill="none" 
                                    stroke="#FF6B35" 
                                    strokeWidth="1" 
                                    opacity={0.3}
                                />
                            )}
                            <circle 
                                cx={x} 
                                cy={y} 
                                r={size} 
                                fill={isPHA ? "#FF6B35" : "#4A90D9"}
                                opacity={0.9}
                            />
                        </g>
                    );
                })}

                {/* Terra al centro */}
                <circle cx="0" cy="0" r="22" fill="url(#earthGrad)"/>
                <circle cx="0" cy="0" r="24" fill="none" stroke="#4A90D9" strokeWidth="1" opacity={0.3}/>
                <circle cx="0" cy="0" r="28" fill="none" stroke="#4A90D9" strokeWidth="0.5" opacity={0.15}/>

                {/* Luna in orbita - molto più lenta del radar */}
                <g style={{ 
                    transformOrigin: '0px 0px', 
                    animation: 'orbit 30s linear infinite' 
                }}>
                    <circle cx="38" cy="0" r="5" fill="#D4CFC0" opacity={0.9}/>
                    {/* Alone lunare */}
                    <circle cx="38" cy="0" r="8" fill="none" stroke="#D4CFC0" strokeWidth="0.5" opacity={0.2}/>
                </g>

                {/* Fascia luminosa radar - AMPIA e in senso orario */}
                <g style={{ 
                    transformOrigin: '0px 0px', 
                    animation: 'sweep 6s linear infinite' 
                }}>
                    {/* Settore ampio di scansione (30 gradi di apertura) */}
                    <path 
                        d="M 0 0 L 230 -60 A 240 240 0 0 1 230 60 Z" 
                        fill="url(#sweepGrad)" 
                        opacity={0.5}
                    />
                    {/* Linea principale più spessa */}
                    <line 
                        x1="0" 
                        y1="0" 
                        x2="235" 
                        y2="0" 
                        stroke="#FF6B35" 
                        strokeWidth="2.5" 
                        opacity={0.9}
                        filter="url(#glow)"
                    />
                    {/* Punta luminosa con glow */}
                    <circle cx="235" cy="0" r="4" fill="#FF6B35" opacity={1} filter="url(#glow)"/>
                    {/* Seconda linea di contorno per spessore visivo */}
                    <line 
                        x1="0" 
                        y1="0" 
                        x2="230" 
                        y2="-15" 
                        stroke="#FF6B35" 
                        strokeWidth="1" 
                        opacity={0.4}
                    />
                    <line 
                        x1="0" 
                        y1="0" 
                        x2="230" 
                        y2="15" 
                        stroke="#FF6B35" 
                        strokeWidth="1" 
                        opacity={0.4}
                    />
                </g>

                {/* HUD: Info in alto a sinistra */}
                <text x="-235" y="-215" fill="#FF6B35" fontSize="10" fontFamily="monospace" fontWeight="bold">
                    ● SCOPE 01
                </text>
                <text x="-235" y="-202" fill="#888" fontSize="9" fontFamily="monospace">
                    RANGE 50 LD
                </text>

                {/* HUD: Contatori in alto a destra */}
                <text x="235" y="-215" textAnchor="end" fill="#888" fontSize="10" fontFamily="monospace">
                    {asteroids.length} TGT
                </text>
                <text x="235" y="-202" textAnchor="end" fill="#FF6B35" fontSize="10" fontFamily="monospace" fontWeight="bold">
                    {phaCount} PHA
                </text>

                {/* HUD: Info in basso */}
                <text x="-235" y="235" fill="#666" fontSize="8">
                    EARTH · GEOCENTRIC
                </text>
                <text x="235" y="235" textAnchor="end" fill="#4A90D9" fontSize="8">
                    ● LIVE
                </text>
            </svg>
        </div>
    );
};