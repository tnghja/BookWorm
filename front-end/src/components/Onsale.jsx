import React, { useState } from "react"
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
export default function Onsale() {
    const [emblaRef, emblaApi] = useEmblaCarousel({
        slidesToScroll: 4,
        align: "start",
    })

    // Sample book data
    const books = [
        {
            id: 1,
            title: "The Great Gatsby",
            author: "F. Scott Fitzgerald",
            originalPrice: "29.99",
            salePrice: "19.99",
            image: ""
        },
        {
            id: 2,
            title: "To Kill a Mockingbird",
            author: "Harper Lee",
            originalPrice: "24.99",
            salePrice: "16.99",
            image: ""
        },
        {
            id: 3,
            title: "1984",
            author: "George Orwell",
            originalPrice: "22.99",
            salePrice: "14.99",
            image: ""
        },
        {
            id: 4,
            title: "Pride and Prejudice",
            author: "Jane Austen",
            originalPrice: "19.99",
            salePrice: "12.99",
            image: ""
        },
        {
            id: 5,
            title: "The Hobbit",
            author: "J.R.R. Tolkien",
            originalPrice: "27.99",
            salePrice: "18.99",
            image: ""
        },
        {
            id: 6,
            title: "Harry Potter",
            author: "J.K. Rowling",
            originalPrice: "32.99",
            salePrice: "22.99",
            image: ""
        },
        {
            id: 7,
            title: "The Alchemist",
            author: "Paulo Coelho",
            originalPrice: "21.99",
            salePrice: "15.99",
            image: ""
        },
        {
            id: 8,
            title: "The Catcher in the Rye",
            author: "J.D. Salinger",
            originalPrice: "23.99",
            salePrice: "17.99",
            image: ""
        }
    ];

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <div className="text-2xl font-bold">Onsale</div>
                <button className="p-2 bg-blue-300 hover:bg-blue-400 rounded-md flex items-center ">
                    <span className="ml-2">View All</span>
                    <ChevronRight/>
                </button>

            </div>

            <div className="mt-4">
                <Carousel
                    opts={{
                        align: "start",
                        loop: false,
                        slidesToScroll: 1
                    }}
                    className="w-full border-2 border-gray-200 bg-gray-100"
                >
                    <div className="m-1 sm:px-11 mt-2 mb-2">
                        <CarouselContent>
                            {books.map((book) => (
                                <CarouselItem key={book.id} className="basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                                    <BookCard
                                        title={book.title}
                                        author={book.author}
                                        originalPrice={book.originalPrice}
                                        salePrice={book.salePrice}
                                        image={book.image}
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
            </div>
        </div>
    )
}
