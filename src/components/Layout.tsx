import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const NAV_LINKS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'restrictions', label: 'Restrictions' },
  { id: 'category', label: 'Category Guide' },
  { id: 'assistant', label: 'AI Assistant' },
  { id: 'registration', label: 'Pilot Registration' },
];

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  return (
    <div className="wrapper">
      {/* Top Bar */}
      <div className="top-bar bg-white border-b border-gray-200 py-3 px-6 md:px-12">
        <div className="container p-0 max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="logo flex items-center gap-4">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/5/5f/Emblem_of_Sri_Lanka.svg"
                alt="Ministry of Defense"
                className="h-20 w-auto"
              />
              <div className="flex flex-col border-l border-gray-300 pl-4 py-1">
                <h1 className="text-xl font-black text-black m-0 leading-tight tracking-tight">
                  DRONE APPROVAL SYSTEM
                </h1>
                <p className="text-[10px] font-bold text-gray-800 m-0 uppercase tracking-tight">
                  Ministry of Defense · Sri Lanka
                </p>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-8">
              <div className="flex items-center gap-3">
                <i className="fa fa-calendar-alt text-2xl text-gray-800"></i>
                <div>
                  <h4 className="text-xs font-bold m-0 text-gray-900">Visit Us</h4>
                  <p className="text-[10px] m-0 text-gray-500">Mon – Fri, 08:30–16:00</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <i className="fa fa-phone-alt text-2xl text-gray-800"></i>
                <div>
                  <h4 className="text-xs font-bold m-0 text-gray-900">Call Us</h4>
                  <p className="text-[10px] m-0 text-gray-500">+94 112 358 819</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <i className="fa fa-envelope text-2xl text-gray-800"></i>
                <div>
                  <h4 className="text-xs font-bold m-0 text-gray-900">Email Us</h4>
                  <p className="text-[10px] m-0 text-gray-500">drone@caa.lk</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Nav */}
      <nav className="bg-[#030f27] sticky top-0 z-[999] py-1">
        <div className="container max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center">
            {NAV_LINKS.map(link => (
              <button
                key={link.id}
                onClick={() => setActiveTab(link.id)}
                className={`border-none bg-transparent cursor-pointer font-bold tracking-wider px-6 py-4 uppercase transition-colors text-xs ${
                  activeTab === link.id ? 'text-[#1388d1]' : 'text-white hover:text-[#1388d1]'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setActiveTab('registration')}
            className="hidden md:block bg-transparent border-2 border-white text-white font-bold py-2 px-6 rounded-sm text-[11px] uppercase tracking-widest hover:bg-white hover:text-[#030f27] transition-all"
          >
            Apply for Flight
          </button>
        </div>
      </nav>

      {/* Main */}
      <main className="min-h-[700px] py-6 bg-[#f4f7f9]">
        {children}
      </main>

      {/* Footer */}
      <footer className="footer" id="contact">
        <div className="container max-w-7xl mx-auto px-4 pb-12">
          <div className="row">
            <div className="col-md-6 col-lg-4 mb-8">
              <div className="footer-contact">
                <h2 className="text-white border-b-2 border-[#1388d1] inline-block mb-6 text-xl">
                  Ministry of Defense
                </h2>
                <p className="flex items-center gap-3 text-sm text-gray-300 mb-2">
                  <i className="fa fa-map-marker-alt w-5"></i> 15/5, Baladaksha Mawatha, Colombo 03
                </p>
                <p className="flex items-center gap-3 text-sm text-gray-300 mb-2">
                  <i className="fa fa-phone-alt w-5"></i> +94 112 430 860
                </p>
                <p className="flex items-center gap-3 text-sm text-gray-300 mb-4">
                  <i className="fa fa-envelope w-5"></i> info@defence.lk
                </p>
                <div className="flex gap-2">
                  {['twitter', 'facebook-f', 'youtube', 'instagram', 'linkedin-in'].map(icon => (
                    <a
                      key={icon}
                      href="#"
                      className="w-10 h-10 border border-gray-600 rounded-full flex items-center justify-center text-white hover:bg-[#1388d1] transition-all"
                    >
                      <i className={`fab fa-${icon}`}></i>
                    </a>
                  ))}
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-4 mb-8">
              <h2 className="text-white border-b-2 border-[#1388d1] inline-block mb-6 text-xl">
                About Drone Hub
              </h2>
              <p className="text-sm text-gray-300 leading-relaxed">
                The Ministry of Defense (MoD) provides this portal to ensure safe and regulated
                unmanned aerial vehicle (UAV) operations across the island, maintaining national
                security and aviation safety.
              </p>
            </div>
            <div className="col-md-6 col-lg-4 mb-8">
              <h2 className="text-white border-b-2 border-[#1388d1] inline-block mb-6 text-xl">
                Quick Links
              </h2>
              <ul className="list-none p-0 text-sm">
                <li className="mb-2"><a href="#" className="text-gray-300 hover:text-[#1388d1]">&gt; ICAO Guidelines</a></li>
                <li className="mb-2"><a href="#" className="text-gray-300 hover:text-[#1388d1]">&gt; Pilot Portal</a></li>
                <li className="mb-2"><a href="#" className="text-gray-300 hover:text-[#1388d1]">&gt; Legal Framework</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="copyright bg-[#020a1a] py-4">
          <div className="container max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between">
            <p className="m-0 text-xs text-gray-400">© 2024–2025 Ministry of Defense. All Rights Reserved.</p>
            <p className="m-0 text-xs text-gray-400">Designed by MoD IT Division</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
