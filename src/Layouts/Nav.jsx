"use client";

import React, { useState, Suspense } from "react";
import Navbar from "../components/Navbar/Navbar";
import NavSidebar from "../components/NavigationSidebar/NavSidebar";
import Footer from "../components/Footer/Footer";
import LoadingSpinner from "../components/LoadingSpinner";

export default function Nav({ children }) {
  const [sidebarIsOpen, setSidebarIsOpen] = useState(false);

  return (
    <div className="app-container f-poppins">
      <Navbar
        sidebarIsOpen={sidebarIsOpen}
        setSidebarIsOpen={setSidebarIsOpen}
      />
      <NavSidebar
        sidebarIsOpen={sidebarIsOpen}
        setSidebarIsOpen={setSidebarIsOpen}
      />
      <Suspense fallback={<LoadingSpinner />}>
        {children}
      </Suspense>
      <Footer />
    </div>
  );
}
