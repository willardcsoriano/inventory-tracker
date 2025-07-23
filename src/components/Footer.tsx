export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-100 text-gray-600 p-4 mt-auto">
      <div className="container mx-auto text-center text-sm">
        <p>&copy; {currentYear} InventoryApp Inc. All Rights Reserved.</p>
      </div>
    </footer>
  )
}