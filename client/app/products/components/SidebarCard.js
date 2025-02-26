"use client";

export default function SidebarCard({ title, children }) {
  return ( 
    <div className="side-card">
      <div className="card-title">
        <h5>{title}</h5>
      </div>
      {children}
    </div>
  );
}
