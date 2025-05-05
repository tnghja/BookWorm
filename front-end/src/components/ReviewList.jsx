import { useQuery } from "@tanstack/react-query";
import { getReviews } from "../api/review";
import PagePagination from "./PagePagination";
import generatePageNumbers from "../helper/helper";
import { useState, useMemo } from "react";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
function ReviewList({ bookId }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('newest');
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [selectedStar, setSelectedStar] = useState('all');

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
  const reviewParams = useMemo(() => ({
    sort_by: sortBy,
    page: currentPage,
    items_per_page: itemsPerPage,
    star: selectedStar !== 'all' ? parseInt(selectedStar) : undefined
  }), [sortBy, currentPage, itemsPerPage, selectedStar]);

  const { data: reviewData,
    isLoading: isReviewLoading,
    error: reviewError,
  } = useQuery({
    queryKey: ['reviews', bookId, sortBy, currentPage, itemsPerPage, selectedStar],
    queryFn: () => getReviews(bookId, reviewParams),
    enabled: !!bookId,
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000
  }
  )
  const handleSortChange = (value) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(parseInt(value, 10));
    setCurrentPage(1);
  };

  const handleStarFilterClick = (starValue) => {
    setSelectedStar(starValue);
    setCurrentPage(1);
  }


  const hasReviews = reviewData?.reviews_count > 0;
  const totalPages = hasReviews ? reviewData?.total_pages : 1;
  const pageNumbers = generatePageNumbers(reviewData?.current_page || 1, totalPages || 1);
  
  return (
    <>

      <div className="text-lg font-semibold">Customer Reviews</div>
      <div className="text-2xl font-bold gap-4 ">{reviewData?.avg_rating?.toFixed(1) || '0.0'} Star</div>
      <div className="text-sm text-gray-600 gap-4">
        <span className="underline cursor-pointer " onClick={() => handleStarFilterClick('all')}>All({reviewData?.reviews_count || 0}) </span>
        <span className="underline cursor-pointer ml-6" onClick={() => handleStarFilterClick('5')}>5 star ({reviewData?.five_stars || 0}) </span> <span className="ml-2">|</span>
        <span className="underline cursor-pointer ml-2" onClick={() => handleStarFilterClick('4')}> 4 star ({reviewData?.four_stars || 0}) </span> <span className="ml-2">|</span>
        <span className="underline cursor-pointer ml-2" onClick={() => handleStarFilterClick('3')}> 3 star ({reviewData?.three_stars || 0}) </span> <span className="ml-2">|</span>
        <span className="underline cursor-pointer ml-2" onClick={() => handleStarFilterClick('2')}> 2 star ({reviewData?.two_stars || 0}) </span> <span className="ml-2">|</span>
        <span className="underline cursor-pointer ml-2" onClick={() => handleStarFilterClick('1')}> 1 star ({reviewData?.one_stars || 0})</span>
      </div>
      <div className='flex justify-between items-center mb-4'>
        <p className="text-gray-600">
          Showing {reviewData?.count === 0 ? 0 : reviewData?.start_item}-{reviewData?.end_item} of {reviewData?.reviews_count || 0} reviews
        </p>
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest" onClick={() => setSortBy('newest')}>Newest to Oldest</SelectItem>
              <SelectItem value="oldest" onClick={() => setSortBy('oldest')}>Oldest to Newest</SelectItem>
            </SelectContent>
          </Select>
          <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Show" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="15">15</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="25">25</SelectItem>
            </SelectContent>
          </Select>
        </div>

      </div>
      {/* Dynamic Reviews */} 
      <ScrollArea className="max-h-[350px] overflow-y-auto">

        {reviewData?.reviews?.map((review) => (
          <div key={review.id} className="border p-3 space-y-1">
            <div className="">
              <span className="font-semibold text-2xl">{review.review_title}</span><span className="text-gray-500 text-md ml-4">| {review.rating_start} stars</span>
            </div>
            <p className="text-sm text-gray-700">{review.review_details}</p>
            <div className="text-xs text-gray-500">
              {new Date(review.review_date).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
              })}
            </div>
          </div>
        ))}
        <ScrollBar></ScrollBar>
      </ScrollArea>


      {/* Always show pagination but disable clicks when no reviews */}
      <PagePagination
        currentPage={reviewData?.current_page || 1}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        pageNumbers={pageNumbers}
      />

    </>
  );
}



export default ReviewList;
