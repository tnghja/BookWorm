export default function BookCard({ title, author, originalPrice, salePrice, image }) {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden h-full flex flex-col">
      <div className="w-full h-64 bg-gray-100 flex items-center justify-center">
        <img
          src={image}
          alt={title || "Book"}
          className="object-cover w-full h-full"
        />
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg mb-1">{title}</h3>
        <p className="text-sm text-gray-600 mb-2">{author}</p>
        <div className="flex items-center justify-between mt-4">
          <div>
            <span className="text-red-500 font-bold">${salePrice}</span>
            {originalPrice && (
              <span className="text-gray-400 text-sm line-through ml-2">
                ${originalPrice}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 