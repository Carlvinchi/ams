import NavBar from "@/components/forms/NavBar";
import Menu from "@/components/Menu";


export default function DashboardLayout({
  children,
}) {
  return (  
      <div className="h-screen flex" >
       {/* LEFT */}
       <div className="w-[14%] md:w-[8%] lg:w-[16%] xl:w-[14%] p-4">
        
        <Menu />

       </div>

       {/* RIGHT */}

       <div className="w-[86%] md:w-[92%] lg:w-[84%] xl:w-[86%] bg-gray-100 overflow-scroll">
        <NavBar />
      
        {children}
       </div>
     </div>      
     
  );
}
