import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChefHat, Home, Soup } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-warm-50 flex flex-col items-center justify-center px-6 text-center" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-md"
      >
        {/* Animated chef hat */}
        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
          transition={{ delay: 0.5, duration: 1.2, ease: 'easeInOut' }}
          className="flex justify-center mb-6"
        >
          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-amber-100 flex items-center justify-center shadow-inner">
              <ChefHat size={56} className="text-amber-500" />
            </div>
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ delay: 1.5, duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-2 -right-2"
            >
              <Soup size={28} className="text-orange-400" />
            </motion.div>
          </div>
        </motion.div>

        {/* 404 number */}
        <motion.h1
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="text-8xl font-black text-amber-500 leading-none mb-2 select-none"
        >
          404
        </motion.h1>

        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-2xl font-bold text-warm-800 mb-3"
        >
          השף לא מצא את המתכון
        </motion.h2>

        {/* Funny subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="text-warm-500 text-base leading-relaxed mb-8"
        >
          חיפשנו בכל הסירים, בכל המגירות ואפילו מתחת למקרר —
          הדף הזה פשוט לא קיים.
          <br />
          <span className="text-amber-500 font-semibold">אולי הוא שרוף?</span> 🔥
        </motion.p>

        {/* Back home button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6 py-3 rounded-2xl shadow-md transition-colors"
        >
          <Home size={18} />
          חזרה לדף הבית
        </motion.button>
      </motion.div>
    </div>
  );
}
