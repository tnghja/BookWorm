import logo from "../assets/logo.png"
export default function Footer() {
    return (
        <footer className="bg-gray-200 py-4 flex flex-row justify-start items-center">
            <img src={logo} alt="logo" className="w-20 h-20" /> 
            <div className="ml-4">
            <p>BOOKWORM</p>
            <p>Address: 123 Main St, Anytown, USA</p>
            <p>Phone: 123-456-7890</p>
            </div>
        </footer>
    );
}
