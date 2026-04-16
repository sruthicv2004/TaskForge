export default function TaskFilter({ setQuery }) {
  return (
    <div className="flex gap-4 mb-4">
      
     
      <input
        type="text"
        placeholder="Search..."
        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
        onChange={(e) => setQuery(e.target.value)}
      />

     
      <select
        className="px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
        onChange={(e) => setQuery(e.target.value)}
      >
        <option value="">All</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>

    </div>
  );
}