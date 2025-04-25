import React from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";

/**
 * ProductPagination Component
 * Props:
 * - currentPage: number
 * - totalPages: number
 * - onPageChange: function(page: number)
 * - pageNumbers: array (with numbers and '...')
 */
export default function PagePagination({ currentPage, totalPages, onPageChange, pageNumbers }) {
  // Always show pagination, even if totalPages is 1
  return (
    <Pagination className="mt-8 justify-center">
      <PaginationContent>
        {/* Previous Button */}
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={e => {
              e.preventDefault();
              if (currentPage > 1) onPageChange(currentPage - 1);
            }}
            aria-disabled={currentPage === 1}
            tabIndex={currentPage === 1 ? -1 : undefined}
            className={currentPage === 1 ? "pointer-events-none opacity-50" : undefined}
          />
        </PaginationItem>
        {/* Page Numbers & Ellipses */}
        {pageNumbers.map((pageNumber, index) => (
          <PaginationItem key={index}>
            {typeof pageNumber === "string" ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink
                href="#"
                onClick={e => {
                  e.preventDefault();
                  onPageChange(pageNumber);
                }}
                isActive={pageNumber === currentPage}
                aria-current={pageNumber === currentPage ? "page" : undefined}
              >
                {pageNumber}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}
        {/* Next Button */}
        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={e => {
              e.preventDefault();
              if (currentPage < totalPages) onPageChange(currentPage + 1);
            }}
            aria-disabled={currentPage === totalPages}
            tabIndex={currentPage === totalPages ? -1 : undefined}
            className={currentPage === totalPages ? "pointer-events-none opacity-50" : undefined}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
