import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Landing } from "./pages/Landing";
import { CitizenDashboard } from "./pages/citizen/CitizenDashboard";
import { RegisterComplaint } from "./pages/citizen/RegisterComplaint";
import { MyComplaints } from "./pages/citizen/MyComplaints";
import { NearbyComplaints } from "./pages/citizen/NearbyComplaints";
import { ComplaintDetail } from "./pages/citizen/ComplaintDetail";
import { Notifications } from "./pages/citizen/Notifications";
import { Profile } from "./pages/citizen/Profile";
import { CitizenLogin } from "./pages/citizen/CitizenLogin";
import { AdhikaariLogin } from "./pages/adhikaari/AdhikaariLogin";
import { AdhikaariHome } from "./pages/adhikaari/AdhikaariHome";
import { AdhikaariProfile } from "./pages/adhikaari/AdhikaariProfile";
import { AdhikaariHistory } from "./pages/adhikaari/AdhikaariHistory";
import { AdhikaariChat } from "./pages/adhikaari/AdhikaariChat";
import { ComplaintManagement } from "./pages/adhikaari/ComplaintManagement";
import { SupervisorLogin } from "./pages/supervisor/SupervisorLogin";
import { SupervisorDashboard } from "./pages/supervisor/SupervisorDashboard";
import { SupervisorChat } from "./pages/supervisor/SupervisorChat";
import { GuestComplaintFlow } from "./pages/guest/GuestComplaintFlow";
import { GuestComplaintSuccess } from "./pages/guest/GuestComplaintSuccess";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          
          {/* Citizen Routes */}
          <Route path="/citizen/login" element={<CitizenLogin />} />
          <Route path="/citizen" element={<CitizenDashboard />} />
          <Route path="/citizen/register-complaint" element={<RegisterComplaint />} />
          <Route path="/citizen/my-complaints" element={<MyComplaints />} />
          <Route path="/citizen/nearby-complaints" element={<NearbyComplaints />} />
          <Route path="/citizen/complaint/:id" element={<ComplaintDetail />} />
          <Route path="/citizen/notifications" element={<Notifications />} />
          <Route path="/citizen/profile" element={<Profile />} />
          
          {/* General login redirect */}
          <Route path="/login" element={<AdhikaariLogin />} />
          
          {/* Adhikaari Routes */}
          <Route path="/adhikaari/login" element={<AdhikaariLogin />} />
          <Route path="/adhikaari" element={<AdhikaariHome />} />
          <Route path="/adhikaari/profile" element={<AdhikaariProfile />} />
          <Route path="/adhikaari/history" element={<AdhikaariHistory />} />
          <Route path="/adhikaari/chat" element={<AdhikaariChat />} />
          <Route path="/adhikaari/complaint/:id" element={<ComplaintManagement />} />
          
          {/* Supervisor Routes */}
          <Route path="/supervisor/login" element={<SupervisorLogin />} />
          <Route path="/supervisor" element={<SupervisorDashboard />} />
          <Route path="/supervisor/chat" element={<SupervisorChat />} />
          
          {/* Guest Routes */}
          <Route path="/guest/complaint-flow" element={<GuestComplaintFlow />} />
          <Route path="/guest/complaint-success/:complaintNumber" element={<GuestComplaintSuccess />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
