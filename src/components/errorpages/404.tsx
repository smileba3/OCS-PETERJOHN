'use client';
import { HomeIcon } from 'evergreen-ui';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function NotFoundPage() {
  const router = useRouter()
  return (
    <div className="h-screen overflow-hidden flex items-center justify-center bg-[#edf2f7]">
      <div className="h-screen w-screen bg-gray-50 flex items-center">
        <div className="container flex flex-col md:flex-row items-center justify-between px-5 text-gray-700">
          <div className="w-full lg:w-1/2 mx-8">
            <div className="text-7xl text-blue-800 font-dark font-extrabold mb-8"> 404</div>
            <p className="text-2xl md:text-3xl font-light leading-normal mb-8">
              {"Sorry we couldn't find the page you're looking for"}
            </p>
            <div className="flex flex-nowrap">
              <button type="button" onClick={() => router.back()} className="px-5 py-3 text-sm font-medium leading-5 shadow-2xl text-white transition-all duration-400 border border-transparent rounded-lg focus:outline-none bg-blue-800 active:bg-red-600 hover:bg-red-700">
                Back
              </button>
              <button type="button" onClick={() => router.replace("/")} className="ml-4 px-5 py-3 text-sm font-medium leading-5 shadow-2xl text-white transition-all duration-400 border border-transparent rounded-lg focus:outline-none bg-blue-800 active:bg-red-600 hover:bg-red-700">
                <span className="flex flex-nowrap items-center"><HomeIcon size={15} marginRight={8} /> Home</span>
              </button>
            </div>
          </div>
          <div className="w-full lg:flex lg:justify-end lg:w-1/2 mx-5 my-12">
            <Image src="/notfound-image-photo.svg" width={1120} height={700} className="" alt="Page not found" />
          </div>
        </div>
      </div>
    </div>
  )
}