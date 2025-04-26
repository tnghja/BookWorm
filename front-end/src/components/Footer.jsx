import logo from "../assets/logo.png"
import { useCurrency } from '@/components/context/CurrencyContext';
import { Button } from "./ui/Button";
export default function Footer() {
    const { selectedCurrency, changeCurrency, supportedCurrencies, loading, error } = useCurrency();
    return (
        <footer className="bg-gray-200 py-4 flex flex-row justify-between">
           <div className="justify-start items-center flex">
           <img src={logo} alt="logo" className="w-20 h-20" /> 
            <div className="ml-4">
            <p>BOOKWORM</p>
            <p>Address: 123 Main St, Anytown, USA</p>
            <p>Phone: 123-456-7890</p>
            </div>
           </div>

            <div className="flex items-center gap-2"> {/* Currency Buttons */}
                 <span className="text-sm mr-2">Currency:</span>
                 {loading && <span className="text-sm text-gray-500">Loading rates...</span>}
                 {error && <span className="text-sm text-red-500">Rate error</span>}
                 {!loading && !error && supportedCurrencies.map((currency) => (
                     <Button
                        key={currency}
                        variant={selectedCurrency === currency ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => changeCurrency(currency)}
                        className="px-3 py-1" // Adjust padding if needed
                     >
                        {currency}
                     </Button>
                 ))}
            </div>
        </footer>
        
    );
}
