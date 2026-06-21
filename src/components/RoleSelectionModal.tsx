import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RoleSelectionModalProps {
  onSelectRole: (role: 'viewer' | 'admin') => void;
}

const RoleSelectionModal: React.FC<RoleSelectionModalProps> = ({ onSelectRole }) => {
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleAdminClick = () => {
    setShowPasswordInput(true);
    setError('');
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '@Jeanys-Olshoppe2019') {
      onSelectRole('admin');
    } else {
      setError('Incorrect password. Please try again.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        className="glass-card w-full max-w-md p-8 relative overflow-hidden"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold font-serif text-[#C9184A] mb-2">Welcome</h2>
          <p className="text-[#9a5060]">Please select your access level</p>
        </div>

        <AnimatePresence mode="wait">
          {!showPasswordInput ? (
            <motion.div
              key="role-selection"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex flex-col gap-4"
            >
              <button
                className="btn-primary py-4 text-lg w-full flex flex-col items-center justify-center group"
                onClick={() => onSelectRole('viewer')}
              >
                <span className="font-bold flex items-center gap-2">👀 Viewer</span>
                <span className="text-sm font-normal opacity-80 group-hover:opacity-100 transition-opacity">
                  Watch the draw and see winners
                </span>
              </button>
              
              <button
                className="btn-secondary py-4 text-lg w-full flex flex-col items-center justify-center group"
                onClick={handleAdminClick}
              >
                <span className="font-bold flex items-center gap-2">🛠️ Admin</span>
                <span className="text-sm font-normal opacity-80 group-hover:opacity-100 transition-opacity">
                  Manage participants and draws
                </span>
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="password-input"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="admin-password" className="text-sm font-semibold text-[#803140]">
                    Admin Password
                  </label>
                  <input
                    id="admin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="glass-input w-full p-3 rounded-lg"
                    placeholder="Enter password"
                    autoFocus
                  />
                  {error && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-red-500 text-sm mt-1"
                    >
                      {error}
                    </motion.p>
                  )}
                </div>
                
                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    className="btn-secondary flex-1"
                    onClick={() => {
                      setShowPasswordInput(false);
                      setPassword('');
                      setError('');
                    }}
                  >
                    Back
                  </button>
                  <button type="submit" className="btn-primary flex-1">
                    Enter
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default RoleSelectionModal;
