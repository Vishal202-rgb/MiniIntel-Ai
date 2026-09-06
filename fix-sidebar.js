const fs = require('fs');
let content = fs.readFileSync('client/src/components/layout/Sidebar.jsx', 'utf8');

const buttonStr = \          {/* Toggle Button */}
          <button 
            onClick={toggleSidebar}
            className={\\\bsolute -right-3 top-5 hidden md:flex items-center justify-center w-6 h-6 bg-[#1c1f26] border border-[#2d3139] rounded-full text-slate-400 hover:text-amber-500 hover:border-amber-500/50 transition-all shadow-sm z-50 \\\\\\}
            aria-label="Toggle Sidebar"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>\;

content = content.replace(buttonStr, '');

const divEndStr = \    </aside>
  );
};\;

const newDivEndStr = \
      {/* Toggle Button */}
      <button 
        onClick={toggleSidebar}
        className={\\\bsolute -right-3 top-5 hidden md:flex items-center justify-center w-6 h-6 bg-[#1c1f26] border border-[#2d3139] rounded-full text-slate-400 hover:text-amber-500 hover:border-amber-500/50 transition-all shadow-sm z-50 \\\\\\}
        aria-label="Toggle Sidebar"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>
    </aside>
  );
};\;

content = content.replace(divEndStr, newDivEndStr);

fs.writeFileSync('client/src/components/layout/Sidebar.jsx', content, 'utf8');
