export default function AboutPage() {
    return (
        <>
            <div>
                <h1>About Us</h1>
                <hr />
                <div className="container px-75 py-4">
                    <h1 className="text-3xl text-center font-bold">Welcome to Bookworm</h1>
                    <div className="my-8">
                        "Bookworm is an independent New York bookstore and language school with locations in
                        Manhattan and Brooklyn. We specialize in travel books and language classes."
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        <div className="space-y-3 text-sm">
                            <div className="text-xl font-bold">Our Story</div>
                            <div>
                                The name Bookworm was taken from the original name for New York International Airport,
                                which was renamed JFK in December 1963.
                            </div>
                            <div>
                                Our Manhattan store has just moved to the West Village. Our new location is 170 7th Avenue
                                South, at the corner of Perry Street.
                            </div>
                            <div>                    From March 2008 through May 2016, the store was located in the Flatiron District.
                            </div>

                        </div>
                        <div className="text-sm space-y-3 ">
                            <div className="text-xl font-bold">Our Vision</div>
        
                                <div>
                                    One of the last travel bookstores in the country, our Manhattan store carries a range of
                                    guidebooks (all 10% off) to suit the needs and tastes of every traveller and budget.
                                </div>
                                <div>
                                    We believe that a novel or travelogue can be just as valuable a key to a place as any guidebook,
                                    and our well-read, well-travelled staff is happy to make reading recommendations for any
                                    traveller, book lover, or gift gives
                                </div>
                            
                        </div>
                    </div>

                </div>

            </div>

        </>
    )
}