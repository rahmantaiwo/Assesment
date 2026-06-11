interface SearchFilterProps {
  search: string;
  setSearch: (val: string) => void;
  category: string;
  setCategory: (val: string) => void;
}

const CATEGORIES = ["All", "Electronics", "Clothing", "Home", "Books", "Beauty"];

export default function SearchFilter({ search, setSearch, category, setCategory }: SearchFilterProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-8">
      <div className="flex-1">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>
      <div className="w-full md:w-48">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat === "All" ? "" : cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
