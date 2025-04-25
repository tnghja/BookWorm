import React, { useState, useMemo } from 'react'; // Added useMemo
import { useNavigate } from "react-router-dom";
import BookCard from '../components/BookCard';
import { useQuery } from '@tanstack/react-query';
import { getBooks } from '../api/books';
import { getCategories } from '../api/category';
import { getAuthors } from '../api/author';
import PagePagination from '../components/PagePagination';

// Import UI Components
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from '@/components/ui/button'; // Assuming Button component exists

import generatePageNumbers from '../helper/helper';

export default function ListProduct() {
    const [currentPage, setCurrentPage] = useState(1);
    const [sortBy, setSortBy] = useState('on_sale'); // Default sort
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedAuthor, setSelectedAuthor] = useState('all');
    const [selectedRating, setSelectedRating] = useState('all'); // Store the string representation 'all', '5', '4', etc.
    const [itemsPerPage, setItemsPerPage] = useState(20); // Default items per page
    const navigate = useNavigate();
    // --- Derived State and API Query Params ---
    // Use useMemo to prevent recalculating params on every render unless dependencies change
    const bookParams = useMemo(() => ({
        category_name: selectedCategory !== 'all' ? selectedCategory : undefined,
        author_name: selectedAuthor !== 'all' ? selectedAuthor : undefined,
        rating: selectedRating !== 'all' ? parseInt(selectedRating) : undefined,
        sort_by: sortBy,
        page: currentPage,
        items_per_page: itemsPerPage,
    }), [selectedCategory, selectedAuthor, selectedRating, sortBy, currentPage, itemsPerPage]);

    const handleProductPage = (id) => {
        navigate(`/product/${id}`);
    }

    const {
        data: booksData,
        isLoading: isBooksLoading,
        isError: isBooksError,
        error: booksError,
    } = useQuery({
        queryKey: ['books', bookParams], // Use the memoized params object
        queryFn: () => getBooks(bookParams),
        keepPreviousData: true, // Good for pagination UX
        staleTime: 5 * 60 * 1000, // Optional: Keep data fresh for 5 minutes
    });

    const { data: authors = [] } = useQuery({
        queryKey: ['authors'],
        queryFn: getAuthors,
    });

    const { data: categories = [] } = useQuery({
        queryKey: ['categories'],
        queryFn: getCategories,
    });

    // --- Calculated Values ---
    const books = booksData?.books || [];
    const totalBooks = booksData?.count || 0;
    const totalPages = booksData?.total_pages || 1; // Get total pages from API response

    // --- Event Handlers ---
    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo(0, 0); // Scroll to top on page change
    };

    // Generic filter handler
    const handleFilterChange = (setter, value) => {
        setter(value);
        setCurrentPage(1); // Reset to first page when filters change
    };

    const handleRatingClick = (ratingValue) => {
        // Extract number from 'X Star' or handle 'All'
        const valueToSet = ratingValue === 'all' ? 'all' : ratingValue.split(' ')[0];
        handleFilterChange(setSelectedRating, valueToSet);
    };

    // Explicit handler for Sort Select
    const handleSortChange = (value) => {
        handleFilterChange(setSortBy, value);
    };

    // Explicit handler for Items Per Page Select
    const handleItemsPerPageChange = (value) => {
        // Convert value to number before setting
        handleFilterChange(setItemsPerPage, parseInt(value, 10));
    };

    // --- Loading and Error States ---
    if (isBooksLoading && !booksData) { // Show loading only on initial fetch
        return <div className="container mx-auto px-4 py-8 text-center">Loading books...</div>;
    }
    if (isBooksError) {
        return <div className="container mx-auto px-4 py-8 text-center text-red-600">Error loading books: {booksError?.message || 'Unknown error'}</div>;
    }

    // --- Render Logic ---
    const pageNumbers = generatePageNumbers(currentPage, totalPages);

    const startItemIndex = totalBooks === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endItemIndex = Math.min(currentPage * itemsPerPage, totalBooks);

    // Helper to create filter buttons
    const renderFilterButton = (key, value, display, selectedValue, handler) => (
        <Button
            key={key}
            variant={selectedValue === value ? "default" : "ghost"} // Use Button component variants
            size="sm" // Smaller buttons might fit better
            className="w-full justify-start text-left h-auto py-1.5 px-2" // Adjust styling
            onClick={() => handler(value)}
        >
            {display}
        </Button>
    );

    const ratingsOptions = ['All', '5 Star', '4 Star', '3 Star', '2 Star', '1 Star'];

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Breadcrumbs */}
            <Breadcrumb className="mb-4">
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/">Home</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/shop">Shop</BreadcrumbLink>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Filters Sidebar */}
                <aside className="w-full md:w-64 lg:w-72 bg-white p-4 rounded-lg shadow-sm flex-shrink-0">
                    <h2 className="text-xl font-semibold mb-4 border-b pb-2">Filter By</h2>
                    <Accordion type="multiple" collapsible="true" className="w-full" defaultValue={['categories', 'authors']}>
                        {/* Categories Filter */}
                        <AccordionItem value="categories">
                            <AccordionTrigger>Categories</AccordionTrigger>
                            <AccordionContent>
                                <ScrollArea className="h-[180px] w-full rounded-md">
                                    <div className="flex flex-col space-y-1 pr-4">
                                        {renderFilterButton('cat-all', 'all', 'All Categories', selectedCategory, (val) => handleFilterChange(setSelectedCategory, val))}
                                        {categories.map((category) => renderFilterButton(
                                            category.id,
                                            category.category_name,
                                            category.category_name,
                                            selectedCategory,
                                            (val) => handleFilterChange(setSelectedCategory, val)
                                        ))}
                                    </div>
                                    <ScrollBar orientation="vertical" />
                                </ScrollArea>
                            </AccordionContent>
                        </AccordionItem>

                        {/* Authors Filter */}
                        <AccordionItem value="authors">
                            <AccordionTrigger>Authors</AccordionTrigger>
                            <AccordionContent>
                                <ScrollArea className="h-[180px] w-full rounded-md">
                                    <div className="flex flex-col space-y-1 pr-4">
                                        {renderFilterButton('author-all', 'all', 'All Authors', selectedAuthor, (val) => handleFilterChange(setSelectedAuthor, val))}
                                        {authors.map((author) => renderFilterButton(
                                            author.id,
                                            author.author_name,
                                            author.author_name,
                                            selectedAuthor,
                                            (val) => handleFilterChange(setSelectedAuthor, val)
                                        ))}
                                    </div>
                                    <ScrollBar orientation="vertical" />
                                </ScrollArea>
                            </AccordionContent>
                        </AccordionItem>

                        {/* Ratings Filter */}
                        <AccordionItem value="ratings">
                            <AccordionTrigger>Ratings</AccordionTrigger>
                            <AccordionContent>
                                <ScrollArea className="h-[180px] w-full rounded-md">
                                    {/* Ensure rating value passed matches expected format ('all', '5', '4'...) */}
                                    <div className="flex flex-col space-y-1 pr-4">
                                        {ratingsOptions.map((rating) => renderFilterButton(
                                            rating,
                                            rating === 'All' ? 'all' : rating.split(' ')[0], // Pass 'all' or '5', '4', etc.
                                            rating, // Display 'All' or '5 Star', etc.
                                            selectedRating,
                                            (val) => handleFilterChange(setSelectedRating, val) // Use the parsed value directly
                                        ))}
                                    </div>
                                    <ScrollBar orientation="vertical" />
                                </ScrollArea>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </aside>

                {/* Main Content Area */}
                <div className="flex-1 min-w-0"> {/* Added min-w-0 for flexbox proper shrinking */}
                    {/* Sort & View Controls */}
                    <div className='flex flex-wrap justify-between items-center mb-4 gap-4'>
                        <p className="text-gray-600 text-sm whitespace-nowrap">
                            Showing {startItemIndex} - {endItemIndex} of {totalBooks} books
                        </p>
                        <div className='flex gap-3'>
                            {/* Controlled Sort By Select */}
                            <Select value={sortBy} onValueChange={handleSortChange}>
                                <SelectTrigger className="w-[160px]">
                                    <SelectValue placeholder="Sort By" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="on_sale">On Sale</SelectItem>
                                    <SelectItem value="popularity">Popularity</SelectItem>
                                    <SelectItem value="price_asc">Price: Low To High</SelectItem>
                                    <SelectItem value="price_desc">Price: High To Low</SelectItem>
                                </SelectContent>
                            </Select>
                            {/* Controlled Show Items Select */}
                            <Select value={String(itemsPerPage)} onValueChange={handleItemsPerPageChange}>
                                <SelectTrigger className="w-[100px]">
                                    <SelectValue placeholder="Show" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="20">20</SelectItem>
                                    <SelectItem value="30">30</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Book Grid - Render based on API results, no client-side slice */}
                    {isBooksLoading && <div className="text-center py-10">Updating results...</div>}
                    {!isBooksLoading && books.length === 0 && (
                        <div className="text-center py-10 text-gray-500">No books found matching your criteria.</div>
                    )}
                    {!isBooksLoading && books.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                            {books.map((book) => (
                                <BookCard
                                    key={book.book.id}
                                    id={book.book.id}
                                    title={book.book.book_title}
                                    author={book.author_name}
                                    originalPrice={book.book.book_price}
                                    salePrice={book.discount_price ?? book.final_price}
                                    image={book.book.book_cover_photo}
                                />
                            ))}
                        </div>
                    )}

                    <PagePagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                        pageNumbers={pageNumbers}
                    />
                </div>
            </div>
        </div>
    );
}