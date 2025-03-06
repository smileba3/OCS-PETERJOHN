export default function LoadingComponent() {
  return (
    <div className="h-full w-full p-8 justify-center items-start">
      <div role="status" className="p-4 space-y-4 rounded-sm shadow-sm animate-pulse">
        <div className="flex items-center justify-between">
          <div className="w-full">
            <div className="h-8 bg-gray-500/50 rounded-lg w-1/2 mb-2.5 mx-auto" />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="w-full">
            <div className="h-4 bg-gray-500/50 rounded-full w-1/2 mb-2.5 mx-auto" />
            <div className="w-1/3 h-3 bg-gray-400/50 rounded-full mx-auto -translate-x-1/4" />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="w-full">
            <div className="h-4 bg-gray-500/50 rounded-full w-1/2 mb-2.5 mx-auto" />
            <div className="w-1/3 h-3 bg-gray-400/50 rounded-full mx-auto -translate-x-1/4" />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="w-full">
            <div className="h-4 bg-gray-500/50 rounded-full w-1/2 mb-2.5 mx-auto" />
            <div className="w-1/3 h-3 bg-gray-400/50 rounded-full mx-auto -translate-x-1/4" />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="w-full">
            <div className="h-4 bg-gray-500/50 rounded-full w-1/2 mb-2.5 mx-auto" />
            <div className="w-1/3 h-3 bg-gray-400/50 rounded-full mx-auto -translate-x-1/4" />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="w-full">
            <div className="h-4 bg-gray-500/50 rounded-full w-1/2 mb-2.5 mx-auto" />
            <div className="w-1/3 h-3 bg-gray-400/50 rounded-full mx-auto -translate-x-1/4" />
          </div>
        </div>
        <span className="sr-only">Loading...</span>
      </div>
    </div>)
}