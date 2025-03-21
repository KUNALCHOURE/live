import React from "react";
import { useNavigate } from "react-router-dom";
import { FaSignInAlt, FaUserPlus, FaVideo } from "react-icons/fa"; 

export default function Navbar() {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate("/auth");
  };

  const handdlejoinasguest=()=>{{
    navigate("/home")
  }}

  return (
    <div className="w-full bg-gray-900 shadow-lg py-4">
      <nav className="container mx-auto flex justify-between items-center px-6">
        
        {/* Logo / Branding */}
        <div className="flex items-center space-x-2 text-white text-2xl font-bold tracking-wide hover:cursor-pointer" onClick={()=>{navigate("/")}} >
          <FaVideo className="text-orange-500 text-3xl" />
          <span>Live Video Call</span>
        </div>

        {/* Navigation Links */}
        <div className="flex items-center space-x-6">
          <p className="text-gray-300 hover:text-white transition duration-300 cursor-pointer flex items-center"  onClick={handdlejoinasguest} >
            <FaUserPlus className="mr-2 text-orange-400" /> Join as Guest
          </p>
          <button 
            className="flex items-center px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition transform hover:scale-105"
            onClick={handleLogin}
          >
            <FaSignInAlt className="mr-2" /> Login
          </button>
        </div>

      </nav>
    </div>
  );
}
