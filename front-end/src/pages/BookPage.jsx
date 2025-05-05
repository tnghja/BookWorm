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
  const [showDialog, setShowDialog] = useState(false);
  const [dialogType, setDialogType] = useState(''); // 'warning' or 'success'
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [quantityError, setQuantityError] = useState('');
  // State for review form
  const { convertAndFormat } = useCurrency();

  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewDetails, setReviewDetails] = useState("");
  const [reviewRating, setReviewRating] = useState("5");
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
    if (!reviewTitle) {
      setReviewError("Title is required.");
      return;
    }
    if (reviewTitle.length > 120) {
      setReviewError("Title must be less than 120 characters.");
      return;
    }
    setReviewError("");
    try {
      await createReview(id, { title: reviewTitle, details: reviewDetails, star: reviewRating });
      // Reset form on success
      queryClient.invalidateQueries(['reviews', id]);
      setReviewTitle("");
      setReviewDetails("");
      setReviewRating("1");
      setReviewError("");
      // Close dialog if open
      setShowReviewDialog(false);
    } catch (error) {
      setReviewError(error); 
      setShowReviewDialog(true);
    }
  };

  // At the top level of your component:
  const addItemToCart = useCartStore((state) => state.addItem);
  // Then in your handler:
  const addItem = () => {
    const currentQty = items.find(item => item.id === bookData?.book.id)?.quantity || 0;
    if (currentQty + quantity > 8) {
      setDialogType('warning');
      setShowDialog(true);
    }

    addItemToCart(createCartItem(
      bookData?.book.book_cover_photo,
      bookData?.book.book_title,
      bookData?.author_name,
      bookData?.book.book_price,
      bookData?.final_price !== bookData?.book.book_price ? bookData?.final_price : 0,
      bookData?.book.id,
      quantity
    ), quantity);
    
    // Show success dialog only if not showing warning
    if (!(currentQty + quantity > 8)) {
      setDialogType('success');
      setShowDialog(true);
    }
  };

  const handleQuantityChange = (value) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue)) {
      if (numValue < 1) {
        setQuantity(1);
        setQuantityError('Minimum quantity is 1');
      } else if (numValue > 8) {
        setQuantity(8);
        setQuantityError('Maximum quantity is 8');
      } else {
        setQuantity(numValue);
        setQuantityError('');
      }
    }
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
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className={dialogType === 'warning' ? 'text-red-500 text-center'  : 'text-green-500 text-center'}>
              {dialogType === 'warning' ? 'Maximum Quantity Reached' : 'Item Added to Cart'}
            </DialogTitle>
            <DialogDescription className="text-center">
              {dialogType === 'warning' 
                ? 'You have reached the maximum quantity of 8 for this book.'
                // of "${bookData?.book.book_title}"
                : `${quantity} ${quantity > 1 ? 'copies' : 'copy'} ${quantity > 1 ? 'have' : 'has'} been added to your cart.`
              }
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
      <div className="container mx-auto px-4 py-8">
        {/* Category and Book Info */}
        <div className="text-xl font-semibold">{bookData?.category_name}</div>
        <hr className="my-8 border-gray-400" />
        <div className="grid grid-cols-1 md:grid-cols-7 md:gap-6 space-y-4">
          <div className="gap-4 grid grid-cols-1 w-full md:col-span-5  md:grid-cols-3 border-2">
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

              <ScrollArea className="max-h-[250px] text-sm overflow-auto w-full ">
                <div className="pb-2">
                  {bookData?.book.book_summary}
                </div>
                <ScrollBar />
              </ScrollArea>


            </div>
          </div>

          {/* Price and Cart */}
          <div className="border h-2/3 space-y-4 col-span-2 ">

            {bookData?.book.book_price !== bookData?.final_price ? (
              <span className="text-xl md:text-2xl font-bold text-red-600 bg-gray-200 h-15 justify-start items-center flex ">
                <span className="line-through text-sm md:text-sm text-gray-400 mr-2 ml-5">{convertAndFormat(bookData?.book.book_price)}</span>{convertAndFormat(bookData?.final_price)}
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
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center gap-2 w-full border h-10">
                  <button
                    className="border px-2  h-10 w-14 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => handleQuantityChange(e.target.value)}
                    className="w-16 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    className="border  h-10 px-2 w-14 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= 8}
                  >
                    +
                  </button>
                </div>
                {quantityError && (
                  <p className="text-red-500 text-xs">{quantityError}</p>
                )}
              </div>
              <button className="bg-black text-white w-full py-2" onClick={
                addItem}>Add to cart</button>
            </div>
          </div>
        </div>

        {/* Customer Reviews Section */}
        <div className="container grid grid-cols-1 md:grid-cols-7 md:gap-6 mt-4 gap-4">

          <div className="md:col-span-5 space-y-4 border-2 p-4">
            <ReviewList
             bookId={bookData?.book.id}
             />
          </div>


          {/* Write a Review */}
          <form className="border p-4 space-y-2 md:col-span-2 flex flex-col max-h-[400px]" onSubmit={handleReviewSubmit}>
            <div className="text-lg font-semibold">Write a Review</div>
            <hr className="py-0.5" />
            
            <div className="text-xs flex justify-between">
              <span>Add a title <span className="text-red-500">*</span></span>
              <span className="text-gray-500">{reviewTitle.length}/120</span>
            </div>
            <input
              className="w-full border p-2 text-sm"
              value={reviewTitle}
              onChange={e => setReviewTitle(e.target.value)}
              maxLength={120}
              required
            />
            
            <div className="text-xs">Details (optional)</div>
            <textarea
              className="w-full border p-2 text-sm min-h-[80px] resize-none"
              rows="4"
              value={reviewDetails}
              onChange={e => setReviewDetails(e.target.value)}
            />
            
            <div className="text-xs">Select a rating star <span className="text-red-500">*</span></div>
            <Select value={reviewRating} onValueChange={setReviewRating} required>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 stars</SelectItem>
                <SelectItem value="4">4 stars</SelectItem>
                <SelectItem value="3">3 stars</SelectItem>
                <SelectItem value="2">2 stars</SelectItem>
                <SelectItem value="1">1 star</SelectItem>
                
              </SelectContent>
            </Select>
            
            {/* {reviewError && <div className="text-red-500 text-xs">{reviewError}</div>} */}
            <button type="submit" className="bg-black text-white w-full py-2 mt-1">Submit Review</button>
          </form>
        </div>
      </div>
    </>
  );
}
