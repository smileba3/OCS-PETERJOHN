import Image from "next/image";
import HeaderTitle from "./_components/headerTitle";
import headerDesign from "./header-design.svg";
import smccLogo from "./smcc-logo.webp";

export default function Layout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="min-h-screen w-full flex flex-col">
      <div className="min-h-[200px] relative">
        <Image className="h-full w-full absolute top-0 left-0 origin-center object-cover -z-10" src={headerDesign} height={200} width={1000} alt="SMCC Logo" />
        <div className="text-white text-2xl max-w-[1000px] text-center mx-auto pt-4">
          <Image className="aspect-square object-fill -z-10 mx-auto max-w-[80px]" src={smccLogo} height={200} width={200} alt="SMCC Logo" />
          <h1 className="text-black text-shadow-yellow uppercase font-[600] mt-2 text-[30px]">Saint Michael College of Caraga</h1>
        </div>
      </div>
      <div className="min-h-[400px] flex-grow">
        <div className="w-fit py-6 px-2 mx-auto bg-yellow-500 rounded-2xl shadow-xl mt-2">
          <h2 className="text-md text-gray-800 font-bold min-w-[300px] text-center">
            <HeaderTitle />
          </h2>
        </div>
        <div className="w-full mt-6 h-full">
          <div className="max-w-[400px] rounded-2xl bg-gray-200 shadow-black shadow-lg min-h-[250px] mx-auto p-4 text-center h-[250px]">
            {children}
          </div>
        </div>
      </div>
      <div className="relative">
        <div className="mx-auto max-w-[90%] bg-[#004aad] h-[20px] rounded-t-3xl" />
      </div>
    </div>
  );
}