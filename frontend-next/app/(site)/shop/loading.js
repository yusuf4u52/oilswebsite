export default function ShopLoading() {
  return (
    <div className="max-w-7xl mx-auto px-6 md:px-10 py-14">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="label">Shop</div>
          <h1 className="serif text-5xl sm:text-6xl mt-2">The full pantry.</h1>
        </div>
      </div>
      <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="product-tile">
            <div className="aspect-square rounded-xl bg-white/60 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
