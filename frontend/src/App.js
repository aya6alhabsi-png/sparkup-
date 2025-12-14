import { Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import Login from "./components/Login";
import Register from "./components/Register";
import ForgetPass from "./components/Forgetpass";
import ResetPass from "./components/ResetPass";
import Adminlogin from "./components/Adminlogin";
import AdminPage from "./components/AdminPage";
import About from "./components/About";
import Contact from "./components/Contact";
import InnovatorPage from "./components/InnovatorPage";
import FunderPage from "./components/FunderPage";
import ShowEvents from "./components/ShowEvents";

import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  return (
    <Routes>
    
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgetpass" element={<ForgetPass />} />
      <Route path="/resetpass" element={<ResetPass />} />
      <Route path="/adminlogin" element={<Adminlogin />} />
      <Route path="/admin" element={<AdminPage />} />

      <Route path="/innovator" element={<InnovatorPage />} />
      <Route path="/funder" element={<FunderPage />} />

      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/events" element={<ShowEvents />} />
      <Route path="*" element={<Home />} />
    </Routes>
  );
}

export default App;
