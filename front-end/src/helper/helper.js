// Helper function to generate page numbers with ellipses
export default function generatePageNumbers(currentPage, totalPages, siblingCount = 1) {
    const totalPageNumbersToShow = siblingCount + 5; // siblingCount + firstPage + lastPage + currentPage + 2*ellipsis

    // Case 1: If the number of pages is less than the page numbers we want to show
    if (totalPageNumbersToShow >= totalPages) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Calculate left and right sibling indices and make sure they are within bounds
    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    // Decide if left/right ellipsis is needed
    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

    const firstPageIndex = 1;
    const lastPageIndex = totalPages;

    // Case 2: No left dots, show right dots
    if (!shouldShowLeftDots && shouldShowRightDots) {
        let leftItemCount = 3 + 2 * siblingCount;
        let leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
        return [...leftRange, '...', totalPages];
    }

    // Case 3: Show left dots, no right dots
    if (shouldShowLeftDots && !shouldShowRightDots) {
        let rightItemCount = 3 + 2 * siblingCount;
        let rightRange = Array.from({ length: rightItemCount }, (_, i) => totalPages - rightItemCount + i + 1);
        return [firstPageIndex, '...', ...rightRange];
    }

    // Case 4: Show both left and right dots
    if (shouldShowLeftDots && shouldShowRightDots) {
        let middleRange = Array.from({ length: rightSiblingIndex - leftSiblingIndex + 1 }, (_, i) => leftSiblingIndex + i);
        return [firstPageIndex, '...', ...middleRange, '...', lastPageIndex];
    }

    // Default fallback (should ideally not be reached with above logic)
    return Array.from({ length: totalPages }, (_, i) => i + 1);
};


  const generateParams = (category, author, rating, sort, page, itemsPerPage, star) => {
    
    const params = {
    sort_by: sort,
    page,
    items_per_page: itemsPerPage,
  };
  if (category && category !== 'all') params.category_name = category;
  if (author && author !== 'all') params.author_name = author;
  if (rating && rating !== 'all' && !isNaN(parseInt(rating))) params.rating = parseInt(rating);
  if (star && star !== 'all' && !isNaN(parseInt(star))) params.star = parseInt(star);
  console.log(params)
  return params;
};