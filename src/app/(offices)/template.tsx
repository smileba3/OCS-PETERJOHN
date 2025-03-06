import FooterComponent from './_components/footer';
import HeaderComponent from './_components/header';
import SidebarComponent from './_components/sidebar';
import SidebarProvider from './_components/sidebar-context';

export default function OfficeLayout({
  children,
}: Readonly<{
  children: React.ReactNode,
}>) {
  return (
    <SidebarProvider>
      <div className="flex flex-nowrap overflow-hidden">
        <SidebarComponent />
        <main className="w-full max-h-screen h-screen overflow-auto flex-grow flex flex-col flex-nowrap relative">
          <HeaderComponent />
          <div className="flex-grow p-2">
            {children}
          </div>
          <FooterComponent />
        </main>
      </div>
    </SidebarProvider>
  )
}