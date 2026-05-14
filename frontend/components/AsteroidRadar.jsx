"use client";

export const AsteroidRadar = ({ asteroids, startDate, endDate }) => {
    return (
        <div className="relative">
            <svg viewBox="-250 -250 500 500">
                <circle cx="0" cy="0" r="230" stroke="var(--border-strong)" fill="none" stroke-width="1"/>
                <circle cx="0" cy="0" r="40" opacity={0.4} stroke="var(--border-strong)" fill="none" stroke-width="1"/>
                <circle cx="0" cy="0" r="110" opacity={0.4} stroke="var(--border-strong)" fill="none" stroke-width="1"/>
                <circle cx="0" cy="0" r="180" opacity={0.4} stroke="var(--border-strong)" fill="none" stroke-width="1"/>

                <line x1="-230" y1="0" x2="230" y2="0" opacity={0.2} stroke="var(--border-strong)" stroke-width="1"/>
                <line x1="0" y1="-230" x2="0" y2="230" opacity={0.2} stroke="var(--border-strong)" stroke-width="1"/>

                <text x="0" y="-240" text-anchor="middle" fill="var(--primary)" font-size="10">N</text>
                <text x="240" y="0" text-anchor="middle" fill="var(--primary)" font-size="10">E</text>
                <text x="0" y="240" text-anchor="middle" fill="var(--primary)" font-size="10">S</text>
                <text x="-240" y="0" text-anchor="middle" fill="var(--primary)" font-size="10">W</text>

                
                <circle cx="0" cy="0" r="20" opacity={0.8} fill="url(#ffff)"/>
                  
                <g style={{ transformOrigin: '0 0', animation: 'orbit 120s linear infinite' }}>
                    <circle cx="40" cy="0" r="4" fill="#D4CFC0" />
                </g>
            </svg>
        </div>
    )
}