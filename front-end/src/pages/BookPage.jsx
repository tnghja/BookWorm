import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { useState } from 'react'
import { useCartStore, createCartItem } from "@/store/cartStore";
import ReviewList from "@/components/ReviewList";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCurrency } from '@/components/context/CurrencyContext';
import { useParams } from "react-router-dom";
import { useQuery , useQueryClient} from "@tanstack/react-query";
import { getBook } from "../api/books";
import { createReview } from "../api/review";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
export default function BookPage() {
  const queryClient = useQueryClient();
  const { id } = useParams();
  const [quantity, setQuantity] = useState(1);
  const items = useCartStore((state) => state.items);
  const [showQuantityDialog, setShowQuantityDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  // State for review form
  const { convertAndFormat } = useCurrency();

  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewDetails, setReviewDetails] = useState("");
  const [reviewRating, setReviewRating] = useState("1");
  const [reviewError, setReviewError] = useState("");

  const { data: bookData,
    isLoading: isBookLoading,
    error: bookError
  } = useQuery({
    queryKey: ['books', id],
    queryFn: () => getBook(id)
  }
  )


  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewTitle || !reviewDetails || !reviewRating) {
      setReviewError("All fields are required.");
      return;
    }
    setReviewError("");
    try {
      await createReview(id, { title: reviewTitle, details: reviewDetails, star: reviewRating });
      // Only reset on success
      queryClient.invalidateQueries(['reviews', id]);
      setReviewTitle("");
      setReviewDetails("");
      setReviewRating("1");
      setReviewError(""); // Optionally clear any previous error
    } catch (error) {
      setReviewError(error); 
      setShowReviewDialog(true);
       
    }
  };

  // At the top level of your component:
  const addItemToCart = useCartStore((state) => state.addItem);
  // Then in your handler:
  const addItem = () => {
    const currentQty = items.find(item => item.id === bookData?.book.id)?.quantity;
    if (currentQty + quantity > 8) {
      setShowDialog(true);
    }
    addItemToCart(createCartItem(
      bookData?.book.book_cover_photo,
      bookData?.book.book_title,
      bookData?.author_name,
      bookData?.book.book_price,
      bookData?.final_price,
      bookData?.book.id,
      quantity,
      quantity * bookData?.final_price
    ), quantity);
  };

  // Handle loading and error states for the book query
  if (isBookLoading) return <div>Loading book details...</div>;
  if (bookError) return <div>Error loading book: {bookError.message}</div>;
  // Ensure bookData exists before rendering dependent components
  if (!bookData) return <div>Book not found.</div>;
  return (
    <>
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Error</DialogTitle>
            <DialogDescription>
              {reviewError}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
      <Dialog open={showQuantityDialog} onOpenChange={setShowQuantityDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Maximum Quantity Reached</DialogTitle>
            <DialogDescription>
              You have reached the maximum quantity of 8 for this book.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
      <div className="container mx-auto px-4 py-8">
        {/* Category and Book Info */}
        <div className="text-xl font-semibold">{bookData?.book.book_title}</div>
        <hr className="my-8 border-gray-400" />
        <div className="grid grid-cols-1 md:grid-cols-7 gap-6">
          <div className="md:col-span-5 gap-4 grid grid-cols-1 md:grid-cols-3 border-2">
            <div className="col-span-1 w-full">
              <div className="w-full bg-gray-200 h-48 flex items-center justify-center">
                <img src={bookData?.book.book_cover_photo} alt={bookData?.book.book_title} className="w-full h-full object-cover" />
              </div>
              <div className="text-sm text-gray-600 text-right mt-2">By {bookData?.author_name} <span className="font-semibold">{bookData?.book.book_author}</span></div>
            </div>

            <div className="flex-1 space-y-2 col-span-2 p-4">
              <div className="text-2xl font-semibold">{bookData?.book.book_title}</div>
              <p className="text-sm text-gray-700">
                Book description :
              </p>

              <ScrollArea className="max-h-[250px] text-sm">
                {bookData?.book.book_summary}
                <ScrollBar></ScrollBar>
              </ScrollArea>


            </div>
          </div>

          {/* Price and Cart */}
          <div className="border  space-y-4 col-span-2">

            {bookData?.book.book_price !== bookData?.final_price ? (
              <span className="text-xl md:text-2xl font-bold text-red-600 bg-gray-200 h-15 justify-start items-center flex ">
                <span className="line-through text-gray-400 mr-2 ml-5">{convertAndFormat(bookData?.book.book_price)}</span>{convertAndFormat(bookData?.final_price)}
              </span>
            ) :
              (<span className="px-4 text-xl md:text-2xl font-bold text-black bg-gray-200 h-15 justify-start items-center flex ">
                {convertAndFormat(bookData?.book.book_price)}
              </span>)
            }
            <div className="container px-4 flex flex-col gap-4">
              <p className="text-sm">
                Quantity
              </p>
              <div className="flex justify-between items-center gap-2 w-full border h-10">
                <button
                  className="border px-2  h-10 w-14 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className="w-8  text-center">{quantity}</span>
                <button
                  className="border  h-10 px-2 w-14 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setQuantity(prev => Math.min(8, prev + 1))}
                  disabled={quantity >= 8}
                >
                  +
                </button>
              </div>
              <button className="bg-black text-white w-full py-2" onClick={
                addItem}>Add to cart</button>
            </div>
          </div>
        </div>

        {/* Customer Reviews Section */}
        <div className="container grid grid-cols-1 md:grid-cols-7 gap-6 mt-4">

          <div className="md:col-span-5 space-y-4 border-2 p-4">
            <ReviewList
             bookId={bookData?.book.id}
             />
          </div>


          {/* Write a Review */}
          <form className="border p-4 space-y-3 col-span-2" onSubmit={handleReviewSubmit}>
            <div className="text-lg font-semibold">Write a Review</div>
            <hr className="py-0.5" />
            <div className="text-xs">Add a title</div>
            <input
              className="w-full border p-2 text-sm"
              value={reviewTitle}
              onChange={e => setReviewTitle(e.target.value)}
          
            />
            <div className="text-xs">Details please! Your review helps others.</div>
            <textarea
              className="w-full border p-2 text-sm"
              rows="4"
              value={reviewDetails}
              onChange={e => setReviewDetails(e.target.value)}
            />
            <div className="text-xs">Select a rating star</div>
            <Select value={reviewRating} onValueChange={setReviewRating}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 star</SelectItem>
                <SelectItem value="2">2 stars</SelectItem>
                <SelectItem value="3">3 stars</SelectItem>
                <SelectItem value="4">4 stars</SelectItem>
                <SelectItem value="5">5 stars</SelectItem>
              </SelectContent>
            </Select>
            {reviewError && <div className="text-red-500 text-xs">{reviewError}</div>}
            <button type="submit" className="bg-black text-white w-full py-2">Submit Review</button>
          </form>
        </div>
      </div>
    </>
  );
}
