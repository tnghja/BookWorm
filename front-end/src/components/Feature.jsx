import React from "react";
import BookCard from "./BookCard";
import { books } from "../components/mock_data/books.jsx";

export default function Feature() {
    
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="justify-between items-center mb-6 flex flex-row sm:flex-col">
                <h1 className="text-2xl font-bold">Feature Books</h1>
                <div className="flex gap-4">
                    <nav className="bg-blue-300 hover:bg-blue-400 rounded-md p-2 w-30 text-center cursor-pointer">
                        Recommended
                    </nav>
                    <nav className="bg-blue-300 hover:bg-blue-400 rounded-md p-2 w-30 text-center cursor-pointer">
                        Popular
                    </nav>
                </div>
            </div>
            
            <div className="bg-gray-100 border-2 border-gray-200 ">

         
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 m-2">
            
                {books.map((book) => (
                    <BookCard
                        key={book.id}
                        title={book.title}
                        author={book.author}
                        originalPrice={book.originalPrice}
                        salePrice={book.salePrice}
                        image={book.image}
                        className=""
                    />
                ))}
            </div>
            </div>
        </div>
    );
}
