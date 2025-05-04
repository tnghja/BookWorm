import React, { useState, useEffect } from "react"
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/Carousel"
import useEmblaCarousel from "embla-carousel-react"
import BookCard from "./BookCard"
import { ChevronRight } from "lucide-react"
import { getBooksOnSale } from "../api/books"
import { Link } from "react-router-dom"
export default function Onsale() {
    const [emblaRef, emblaApi] = useEmblaCarousel({
        slidesToScroll: 4,
        align: "start",
    })

    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Fetch books on sale from the API
    useEffect(() => {
        const fetchBooks = async () => {
            try {
                setLoading(true);
                const data = await getBooksOnSale(10);
                if (data && data.books) {
                    setBooks(data.books);
                    console.log(data);

                }
            } catch (err) {
                console.error('Error fetching on-sale books:', err);
                setError('Failed to load books. Please try again later.');
            } finally {
                setLoading(false);
            }
        };
        
        fetchBooks();
    }, []); // Empty dependency array to avoid infinite loop

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <div className="text-2xl font-bold">On Sale Books</div>
                <Link to="/shop" className="p-2 bg-black hover:bg-gray-700 rounded-md flex items-center text-white">
                    <span className="mr-1">View All</span>
                    <ChevronRight size={18} />
                </Link>
            </div>

            {error && (
                <div className="text-red-500 p-4 text-center">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-800"></div>
                </div>
            ) : (
                <div className="mt-4">
                    {books.length === 0 ? (
                        <div className="text-center py-8">No books on sale at the moment.</div>
                    ) : (
                        <Carousel
                            opts={{
                                align: "start",
                                loop: false,
                                slidesToScroll: 1
                            }}
                            className="w-full border-2 border-gray-200 bg-gray-100 rounded-lg"
                        >
                            <div className="m-1 sm:px-11 mt-2 mb-2">
                                <CarouselContent>
                                    {books.map((book) => (
                                        <CarouselItem key={book.book.id} className="basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                                            <BookCard
                                                id={book.book.id}
                                                title={book.book.book_title}
                                                author={book.author_name}
                                                originalPrice={book.book.book_price}
                                                salePrice={book.discount_price || book.final_price}
                                                image={book.book.book_cover_photo}
                                            />
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                            </div>  
                            <div className="flex justify-center gap-4 sm:hidden h-8 mt-4">
                                <CarouselPrevious className="static h-10 w-10 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 mt-2" />
                                <CarouselNext className="static h-10 w-10 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 mt-2" />
                            </div>
                            <div className="hidden sm:block">
                                <CarouselPrevious className="absolute left-0 top-1/2 -translate-y-1 h-10 w-10 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 z-10 ml-1"  />
                                <CarouselNext className="absolute right-0 top-1/2 -translate-y-1 h-10 w-10 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 z-10 mr-1" />
                            </div>
                        </Carousel>
                    )}
                </div>
            )}
        </div>
    )
}
