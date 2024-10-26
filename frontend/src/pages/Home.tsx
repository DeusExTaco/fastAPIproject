
function Home() {
  return (
      <div className="bg-gray-100 min-h-screen flex items-center justify-center">
        <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Welcome to Your App</h1>
          <p className="text-gray-600 mb-6">This is the home page.</p>
          <a href="/login"
             className="text-indigo-600 font-semibold hover:text-indigo-800 underline transition duration-200">
              Go to Login
          </a>
        </div>
      </div>
  );
}

export default Home;
