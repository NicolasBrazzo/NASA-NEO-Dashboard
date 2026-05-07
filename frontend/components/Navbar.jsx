import Link from "next/link"

export const Navbar = () => {
    return (
        <nav className="w-full h-16 bg-gray-800 text-white flex items-center justify-between px-4">
            <div className="text-lg font-bold">NASA NEO Dashboard</div>
            <div className="flex space-x-4">
                <Link href="/" className="hover:text-gray-400">Home</Link>
                <Link href="/asteroids" className="hover:text-gray-400">Asteroids</Link>
                <Link href="/stats" className="hover:text-gray-400">Stats</Link>
            </div>
        </nav>
    )
}