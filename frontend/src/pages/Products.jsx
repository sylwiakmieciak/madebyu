export default function Products() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-serif font-bold text-primary-dark mb-8">
        Wszystkie Produkty
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* TODO: Pobierz produkty z API */}
        <p className="text-gray-600 col-span-full text-center py-12">
          Produkty będą tutaj wyświetlone po połączeniu z backend API
        </p>
      </div>
    </div>
  );
}
