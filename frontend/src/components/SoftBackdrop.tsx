const SoftBackdrop = () => {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <div className="absolute left-1/2 top-20 -translate-x-1/2 w-245 h-115 rounded-full blur-3xl" style={{backgroundColor: 'rgba(233, 71, 245, 0.15)'}} />
      <div className="absolute right-12 bottom-10 w-105 h-55 rounded-full blur-2xl" style={{backgroundColor: 'rgba(47, 75, 162, 0.15)'}} />
    </div>
  );
};

export default SoftBackdrop;
