import { useNavigate } from "react-router-dom";
import temp_image from "@/assets/book.png";
import { useCurrency } from '@/components/context/CurrencyContext';
export default function BookCard({ id, title, author, originalPrice, salePrice, image, onClick }) {
  const navigate = useNavigate();
  // Get conversion function and loading state from context
  const { convertAndFormat } = useCurrency();

  const handleClick = onClick || (() => {
    if (id) navigate(`/product/${id}`);
  });

  const displayOriginalPrice = convertAndFormat(originalPrice);
  const displaySalePrice = (originalPrice !== salePrice) ? convertAndFormat(salePrice) : null;

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden h-full flex flex-col cursor-pointer" onClick={handleClick}>
      <div className="w-full h-64 bg-gray-100 flex items-center justify-center">
        <img
          src={image || temp_image}
          alt={title || 'Book'}
          className="object-cover w-full h-full"
        />
      </div>
      <div className="p-4 flex-grow flex flex-col justify-between"> {/* Ensure content pushes footer down */}
        <div> {/* Title and Author */}
          <h3 className="font-bold text-lg mb-1 line-clamp-2">{title || 'Untitled Book'}</h3> {/* Limit title lines */}
          <p className="text-sm text-gray-600 mb-2">{author || 'Unknown Author'}</p>
        </div>
        {
          (displaySalePrice ? (
            <div className="mt-4 gap-2 flex items-center"> {/* Price Section */}
              {/* Display the formatted original price if it exists and is different */}
              <span className="text-gray-400 text-sm line-through">
                {displayOriginalPrice}
              </span>
            
              <span className="text-red-500 font-bold text-lg">{displaySalePrice}</span>
            </div>)
            :
            <span className="text-black font-bold text-lg">{displayOriginalPrice}</span>)
        }

      </div>
    </div>
  );
}