import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const cloudinary = (url) => url.replace('/upload/', '/upload/c_fill,g_auto,w_600,h_400,q_auto,f_auto/')

const results = [
  { url: 'https://res.cloudinary.com/dlljlca9p/image/upload/v1782269847/IMG_4626_ooibzg.jpg', name: 'Tiana A.', points: '+118 pts' },
  { url: 'https://res.cloudinary.com/dlljlca9p/image/upload/v1782269808/IMG_4628_iyzvlx.jpg', name: 'Delvonta P.', points: '+129 pts' },
  { url: 'https://res.cloudinary.com/dlljlca9p/image/upload/v1782269717/IMG_4631_nhrrzw.png', name: 'Client Result', points: '+132 pts' },
  { url: 'https://res.cloudinary.com/dlljlca9p/image/upload/v1782269791/IMG_4632_ekqnbe.jpg', name: 'Stephanie B.', points: '+112 pts' },
  { url: 'https://res.cloudinary.com/dlljlca9p/image/upload/v1782269666/IMG_4633_sg2ks7.jpg', name: 'Cordel F.', points: '+185 pts' },
  { url: 'https://res.cloudinary.com/dlljlca9p/image/upload/v1782269660/IMG_4634_ukjxdo.jpg', name: 'Brian M.', points: '+125 pts' },
  { url: 'https://res.cloudinary.com/dlljlca9p/image/upload/v1782269639/IMG_4637_mpxpqm.jpg', name: 'Kyshaun B.', points: '+154 pts' },
  { url: 'https://res.cloudinary.com/dlljlca9p/image/upload/v1782269628/IMG_4638_n2zajc.jpg', name: 'Cody S.', points: '+335 pts' },
  { url: 'https://res.cloudinary.com/dlljlca9p/image/upload/v1782269621/IMG_4639_tznaen.jpg', name: 'Client Result', points: '+100+ pts' },
  { url: 'https://res.cloudinary.com/dlljlca9p/image/upload/v1782269612/IMG_4640_owqmzf.jpg', name: 'Client Result', points: '+100+ pts' },
  { url: 'https://res.cloudinary.com/dlljlca9p/image/upload/v1782269606/IMG_4641_usapfu.jpg', name: 'Client Result', points: '+100+ pts' },
  { url: 'https://res.cloudinary.com/dlljlca9p/image/upload/v1782269477/IMG_4625_tylxdi.jpg', name: 'Client Result', points: '+100+ pts' },
]

export default function ResultsGallery() {
  const [selected, setSelected] = useState(null)
  return (
    <section id="results-gallery" className="py-24 px-6 bg-[#0d1f3c]/50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-block bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e] text-xs font-semibold px-4 py-1.5 rounded-full mb-4 uppercase tracking-widest">Proof It Works</div>
          <h2 className="font-syne text-4xl font-bold mb-4">Real Client <span className="gradient-text">Results</span></h2>
          <p className="text-slate-400 max-w-xl mx-auto">These aren't made up numbers. Real people who trusted Score Plug and transformed their credit.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {results.map((img, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="relative group cursor-pointer rounded-xl overflow-hidden border border-slate-700 hover:border-[#22c55e]/50 transition-all hover:scale-105" onClick={() => setSelected(img)}>
              <img src={cloudinary(img.url)} alt={img.name} className="w-full h-48 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628] via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <div className="text-[#22c55e] font-syne font-bold text-lg">{img.points}</div>
                <div className="text-slate-300 text-xs">{img.name}</div>
              </div>
              <div className="absolute inset-0 bg-[#22c55e]/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white font-syne font-bold text-sm bg-[#22c55e] px-3 py-1 rounded-full">View Full Result</span>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="text-center mt-12">
          <button onClick={() => document.getElementById('get-started')?.scrollIntoView({ behavior: 'smooth' })} className="bg-[#22c55e] text-[#0a1628] px-8 py-4 rounded-full font-syne font-bold text-lg hover:bg-[#16a34a] transition-all hover:scale-105 shadow-lg shadow-[#22c55e]/20">Get Results Like These →</button>
        </div>
      </div>
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-6" onClick={() => setSelected(null)}>
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }} className="relative max-w-3xl w-full" onClick={e => e.stopPropagation()}>
              <img src={selected.url} alt={selected.name} className="w-full max-h-[80vh] object-contain rounded-2xl" />
              <div className="text-center mt-4"><span className="text-[#22c55e] font-syne font-bold text-2xl">{selected.points}</span><span className="text-slate-400 ml-3">{selected.name}</span></div>
            </motion.div>
            <button className="absolute top-6 right-6 text-white text-4xl font-bold hover:text-[#22c55e]" onClick={() => setSelected(null)}>×</button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
