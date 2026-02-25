export default function Footer() {
  return (
    <footer
      className="w-full mt-20 border-t backdrop-blur-xl"
      style={{
        backgroundColor: `rgba(var(--nav), var(--nav-alpha))`,
        borderColor: `rgba(var(--border), var(--border-alpha))`,
        color: `rgb(var(--muted))`,
      }}
    >
      <div className="max-w-6xl mx-auto px-4 py-10">

        {/* top row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">

          {/* left logo */}
          <div className="text-center md:text-left">
            <h2 className="text-lg font-bold tracking-tight" style={{color:`rgb(var(--text))`}}>
              Smart<span className="text-emerald-400">Planner</span>
            </h2>
            <p className="text-sm opacity-80 mt-1">
              AI powered study productivity system 🚀
            </p>
          </div>

          {/* center links */}
          <div className="flex items-center gap-6 text-sm font-medium">
        
          </div>

          {/* right social */}
           <div className="text-center text-xs opacity-70">
          © {new Date().getFullYear()} Smart Planner • Built by Harshit 💻  Presented by Deepmala 👩‍💻 
          <br />
          <span className="opacity-60">Stay focused. Stay consistent.</span>
        </div>
        
        </div>

        {/* divider */}
        <div
          className="my-6 h-px"
          style={{ backgroundColor: `rgba(var(--border), var(--border-alpha))` }}
        />

        {/* bottom */}
    
      </div>
    </footer>
  );
}