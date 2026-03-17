import React, { useState, useEffect } from "react"; 
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import About from "./pages/About";
import PersonalData   from "./pages/PersonalData";
import Admin          from "./pages/Admin";
import EditProfile    from "./pages/EditProfile";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  return (
    <Router>
      <div className="App">
        <Navbar isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
        <div className="page-container">
          <div className="content-wrap">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
              <Route path="/signup" element={<SignUp setIsLoggedIn={setIsLoggedIn} />} />
              <Route path="/about" element={<About />} />
              <Route path="/profile" element={isLoggedIn ? <PersonalData /> : <Navigate to="/login" />} />
              <Route path="/edit-profile" element={isLoggedIn ? <EditProfile /> : <Navigate to="/login" />} />
              <Route path="/manage" element={isLoggedIn ? <Admin /> : <Navigate to="/login" />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </div>
        <Footer />
      </div>
    </Router>
  );
}  

export default App;
