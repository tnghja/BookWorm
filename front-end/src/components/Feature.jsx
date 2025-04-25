import React, { useState, useEffect } from "react";
import BookCard from "./BookCard";
import { getRecommendedBooks, getMostReviewedBooks } from "../api/books";

export default function Feature() {
    const [books, setBooks] = useState([]);
    const [activeTab, setActiveTab] = useState('recommended');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        const fetchBooks = async () => {
            try {
                setLoading(true);
                setError(null);
                
                let data;
                if (activeTab === 'recommended') {
                    data = await getRecommendedBooks(8);  // Fetch 8 recommended books
                } else {
                    data = await getMostReviewedBooks(8);  // Fetch 8 most reviewed books
                }
                
                if (data && data.books) {
                    setBooks(data.books);
                }
            } catch (err) {
                console.error(`Error fetching ${activeTab} books:`, err);
                setError(`Failed to load ${activeTab} books. Please try again later.`);
            } finally {
                setLoading(false);
            }
        };
        
        fetchBooks();
    }, [activeTab]); // Re-fetch when the active tab changes
    
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="justify-between items-center mb-6 flex flex-row sm:flex-col">
                <h1 className="text-2xl font-bold">Feature Books</h1>
                <div className="flex gap-4">
                    <nav 
                        className={`${activeTab === 'recommended' ? 'bg-blue-500 text-white' : 'bg-blue-300'} hover:bg-blue-400 rounded-md p-2 w-30 text-center cursor-pointer`}
                        onClick={() => setActiveTab('recommended')}
                    >
                        Recommended
                    </nav>
                    <nav 
                        className={`${activeTab === 'popular' ? 'bg-blue-500 text-white' : 'bg-blue-300'} hover:bg-blue-400 rounded-md p-2 w-30 text-center cursor-pointer`}
                        onClick={() => setActiveTab('popular')}
                    >
                        Popular
                    </nav>
                </div>
            </div>
            
            <div className="bg-gray-100 border-2 border-gray-200 min-h-[300px]">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : error ? (
                    <div className="flex justify-center items-center h-64 text-red-500">
                        {error}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 m-2">
                        {console.log(books)}
                        {books.length > 0 ? (
                            books.map((book) => (
                                <BookCard
                                    id={book.book.id}
                                    key={book.book.id}
                                    title={book.book.title}
                                    author={book.author_name}
                                    originalPrice={book.book.book_price}
                                    salePrice={book.final_price}
                                    image={book.book.book_cover_photo }
                          
                                />
                            ))
                        ) : (
                            <div className="col-span-4 text-center py-8 text-gray-500">
                                No books available in this category.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
